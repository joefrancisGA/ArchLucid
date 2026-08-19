export type DesktopNotificationPermission = NotificationPermission | "unsupported";

export function getDesktopNotificationPermission(): DesktopNotificationPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<DesktopNotificationPermission> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showDesktopNotification(title: string, options?: NotificationOptions): boolean {
  if (getDesktopNotificationPermission() !== "granted") {
    return false;
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
