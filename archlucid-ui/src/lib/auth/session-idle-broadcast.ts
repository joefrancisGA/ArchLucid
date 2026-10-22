import { SESSION_IDLE_BROADCAST_CHANNEL } from "@/lib/auth/session-idle-timeout";

export type SessionIdleBroadcastMessage =
  | { readonly type: "activity" }
  | { readonly type: "auth-cleared" };

export function postSessionIdleBroadcastMessage(message: SessionIdleBroadcastMessage): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(SESSION_IDLE_BROADCAST_CHANNEL);

  channel.postMessage(message);
  channel.close();
}

export function subscribeSessionIdleBroadcast(
  listener: (message: SessionIdleBroadcastMessage) => void,
): () => void {
  if (typeof BroadcastChannel === "undefined") {
    return () => undefined;
  }

  const channel = new BroadcastChannel(SESSION_IDLE_BROADCAST_CHANNEL);

  const onMessage = (event: MessageEvent<SessionIdleBroadcastMessage>) => {
    const message = event.data;

    if (message?.type === "activity" || message?.type === "auth-cleared") {
      listener(message);
    }
  };

  channel.addEventListener("message", onMessage);

  return () => {
    channel.removeEventListener("message", onMessage);
    channel.close();
  };
}
