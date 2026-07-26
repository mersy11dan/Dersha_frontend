import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Live selfie capture for the eKYC step.
 *
 * Falls back to a synthetic capture when no camera is available or permission
 * is denied, so onboarding stays testable on machines without a webcam. The
 * fallback is reported through `usedFallback` rather than being disguised as a
 * real capture.
 */
export function useCameraCapture() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [status, setStatus] = useState('idle') // idle | starting | live | denied | captured
  const [capture, setCapture] = useState(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [error, setError] = useState(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback(async () => {
    setError(null)
    setStatus('starting')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('denied')
      setError('This browser cannot access a camera.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('live')
    } catch (err) {
      setStatus('denied')
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow it in your browser, or continue with a simulated capture.'
          : 'No camera was detected. You can continue with a simulated capture.',
      )
    }
  }, [])

  const takePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || status !== 'live') return null

    const canvas = document.createElement('canvas')
    const size = Math.min(video.videoWidth, video.videoHeight) || 480
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')
    context.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      size,
      size,
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapture(dataUrl)
    setUsedFallback(false)
    setStatus('captured')
    stop()
    return dataUrl
  }, [status, stop])

  /** Produces a placeholder payload large enough to satisfy the API's minimum. */
  const useSimulatedCapture = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 240
    const context = canvas.getContext('2d')
    const gradient = context.createLinearGradient(0, 0, 240, 240)
    gradient.addColorStop(0, '#0f766e')
    gradient.addColorStop(1, '#1e293b')
    context.fillStyle = gradient
    context.fillRect(0, 0, 240, 240)
    context.fillStyle = '#ffffff'
    context.font = 'bold 16px sans-serif'
    context.textAlign = 'center'
    context.fillText('SIMULATED', 120, 115)
    context.fillText('CAPTURE', 120, 135)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapture(dataUrl)
    setUsedFallback(true)
    setStatus('captured')
    stop()
    return dataUrl
  }, [stop])

  const reset = useCallback(() => {
    setCapture(null)
    setUsedFallback(false)
    setStatus('idle')
    setError(null)
  }, [])

  return {
    videoRef,
    status,
    capture,
    usedFallback,
    error,
    start,
    takePhoto,
    useSimulatedCapture,
    reset,
  }
}
