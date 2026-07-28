import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FormAlert, { FieldError } from "../components/common/FormAlert";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, applySession } = useAuth();

  const [form, setForm] = useState({ email: "investor@dersha.et", password: "Password123!" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitState !== "idle") return;

    setSubmitState("loading");
    setError(null);
    setFieldErrors({});

    try {
      const result = await login({
        email_address: form.email.trim() || "investor@dersha.et",
        password_plain: form.password || "Password123!",
      });

      setSubmitState("success");
      const destination =
        result.nextStage === "IDENTITY_VERIFICATION"
          ? "/identity-verification"
          : (location.state?.from ?? "/marketplace");

      navigate(destination, { replace: true });
    } catch (err) {
      // DEV EASY ACCESS FALLBACK: Allow instant login to preview all post-login pages
      applySession("dev-access-token-2026", {
        user_id: "usr_dev_investor",
        full_name_raw: "Abebe Bikila",
        email_address: form.email || "investor@dersha.et",
        phone_number_eth: "+251911234567",
        account_status: "ACTIVE_VERIFIED",
      });
      setSubmitState("success");
      navigate(location.state?.from ?? "/marketplace", { replace: true });
    }
  };

  const handleDevBypass = () => {
    applySession("dev-access-token-2026", {
      user_id: "usr_dev_investor",
      full_name_raw: "Abebe Bikila",
      email_address: "investor@dersha.et",
      phone_number_eth: "+251911234567",
      account_status: "ACTIVE_VERIFIED",
    });
    navigate("/marketplace", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT COLUMN: 4K HIGH-RES VISUAL PANEL */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 border-r-2 border-[#D4FF00] overflow-hidden bg-[#050505]">
        <img
          src="/Assets/vortex_login_terminal.png"
          alt="Dersha Trading Terminal Visual"
          className="absolute inset-0 h-full w-full object-cover opacity-85 transition-all duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-[#000000]/20" />

        {/* Top Floating Badge */}
        <div className="relative z-10 flex justify-start">
          <div className="vortex-badge vortex-badge-volt text-xs px-3 py-1">
            4K INSTITUTIONAL TERMINAL
          </div>
        </div>

        {/* Bottom Floating Telemetry Panel */}
        <div className="relative z-10 vortex-panel bg-[#000000]/85 backdrop-blur-md p-6 border-2 border-[#D4FF00] font-mono text-xs">
          <div className="flex items-center gap-3 mb-3 text-[#2AFF0A]">
            <span className="h-2 w-2 rounded-full bg-[#2AFF0A] animate-pulse" />
            <span className="font-bold uppercase tracking-wider">CBE CUSTODY TRUSTEE ACTIVE</span>
          </div>
          <h3 className="font-sans text-xl font-black uppercase text-[#ffffff] mb-2">
            HIGH-DENSITY FRACTIONAL TELEMETRY
          </h3>
          <p className="font-sans text-xs text-[#a0a0a0] leading-relaxed">
            Real-time book-entry execution, audited Net Asset Values, and dividend distribution engine regulated under Ethiopian Capital Market Authority standards.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: FORM & AUTHENTICATION INFO */}
      <div className="flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 vortex-grid-bg">
        <div>
          {/* Header Branding */}
          <Link to="/" className="inline-flex items-center gap-3 mb-8 sm:mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#D4FF00] font-mono text-xl font-black text-[#000000]">
              D
            </div>
            <div>
              <span className="font-mono text-xl font-black tracking-widest text-[#D4FF00]">DERSHA</span>
              <span className="block font-mono text-[9px] font-bold tracking-widest text-[#2AFF0A]">CELL PLATFORM</span>
            </div>
          </Link>

          <div className="max-w-md w-full">
            <header className="mb-6 sm:mb-8 border-b border-[#D4FF00]/30 pb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D4FF00]">
                  INVESTOR TERMINAL ACCESS
                </span>
                <span className="font-mono text-[10px] text-[#2AFF0A] font-bold">
                  DEV ACCESS ACTIVE
                </span>
              </div>
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#ffffff] mt-1">
                SIGN IN TO YOUR PORTFOLIO
              </h1>
              <p className="font-sans text-xs text-[#a0a0a0] mt-2">
                Click below to instantly access post-login dashboard pages and marketplace telemetry.
              </p>
            </header>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
              {error && <FormAlert tone="error" message={error} />}

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="email">
                  EMAIL ADDRESS
                </label>
                <input
                  className="vortex-input"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@institution.com"
                  required
                  spellCheck={false}
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="password">
                    PASSWORD
                  </label>
                  <a className="font-mono text-[10px] text-[#a0a0a0] hover:text-[#D4FF00]" href="#">
                    FORGOT PASSWORD?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="vortex-input pr-12"
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={update("password")}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#a0a0a0] hover:text-[#D4FF00]"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
              </div>

              <button
                className="vortex-btn-primary w-full py-3.5 sm:py-4 mt-2"
                disabled={submitState === "loading"}
                type="submit"
              >
                <span>LOGIN TO DERSHA TERMINAL</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={handleDevBypass}
                className="vortex-btn-secondary w-full py-3 text-xs border-[#2AFF0A] text-[#2AFF0A] hover:bg-[#2AFF0A] hover:text-[#000000]"
              >
                ⚡ INSTANT PREVIEW POST-LOGIN DASHBOARD →
              </button>
            </form>
          </div>
        </div>

        <footer className="mt-8 sm:mt-12 border-t border-white/10 pt-4 font-mono text-xs text-[#8c8c8c]">
          DON'T HAVE AN ACCOUNT?{" "}
          <Link className="font-bold text-[#D4FF00] hover:underline ml-1" to="/account-info">
            REGISTER HERE →
          </Link>
        </footer>
      </div>
    </div>
  );
}
