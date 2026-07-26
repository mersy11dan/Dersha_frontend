import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

export type RealtimeTopic =
  | "market"
  | `subfund:${string}`
  | `basket:${string}`;

interface RealtimeMessage {
  topic: RealtimeTopic;
  event: string;
  data: unknown;
  at: string;
}

/**
 * Broadcast hub for live market data.
 *
 * Clients subscribe to topics ("market", "subfund:<id>", "basket:<id>") and
 * receive only what they asked for, so a page watching one basket is not woken
 * by every trade on the platform.
 *
 * This is read-only: nothing a client sends over the socket can mutate state,
 * which is why the connection is not authenticated.
 */
class RealtimeHub {
  private server: WebSocketServer | null = null;
  private readonly subscriptions = new Map<WebSocket, Set<string>>();

  attach(httpServer: Server, path = "/ws") {
    this.server = new WebSocketServer({ server: httpServer, path });

    this.server.on("connection", (socket) => {
      this.subscriptions.set(socket, new Set(["market"]));

      socket.on("message", (raw) => {
        try {
          const message = JSON.parse(raw.toString());
          const topics = this.subscriptions.get(socket);
          if (!topics) return;

          if (message.action === "subscribe" && typeof message.topic === "string") {
            topics.add(message.topic);
          } else if (
            message.action === "unsubscribe" &&
            typeof message.topic === "string"
          ) {
            topics.delete(message.topic);
          }
        } catch {
          // A malformed frame is ignored rather than dropping the connection.
        }
      });

      socket.on("close", () => this.subscriptions.delete(socket));
      socket.on("error", () => this.subscriptions.delete(socket));

      socket.send(
        JSON.stringify({
          topic: "market",
          event: "connected",
          data: { message: "Subscribed to the Dersha market feed." },
          at: new Date().toISOString(),
        }),
      );
    });

    return this.server;
  }

  publish(topic: RealtimeTopic, event: string, data: unknown) {
    if (!this.server) return;

    const payload: RealtimeMessage = {
      topic,
      event,
      data,
      at: new Date().toISOString(),
    };
    const frame = JSON.stringify(payload);

    for (const [socket, topics] of this.subscriptions) {
      if (socket.readyState === WebSocket.OPEN && topics.has(topic)) {
        socket.send(frame);
      }
    }
  }

  get connectionCount() {
    return this.subscriptions.size;
  }

  close() {
    this.server?.close();
    this.subscriptions.clear();
  }
}

export const realtimeHub = new RealtimeHub();
