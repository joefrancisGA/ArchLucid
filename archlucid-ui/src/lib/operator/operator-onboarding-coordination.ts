/** In-memory gate so the guided tour never renders while the welcome modal is visible. */
let welcomeModalVisible = false;
const welcomeModalVisibilityListeners = new Set<() => void>();

function notifyWelcomeModalVisibility(): void {
  for (const listener of welcomeModalVisibilityListeners) {
    listener();
  }
}

export function setWelcomeModalVisible(visible: boolean): void {
  if (welcomeModalVisible === visible) {
    return;
  }

  welcomeModalVisible = visible;
  notifyWelcomeModalVisibility();
}

export function isWelcomeModalVisible(): boolean {
  return welcomeModalVisible;
}

export function subscribeWelcomeModalVisible(listener: () => void): () => void {
  welcomeModalVisibilityListeners.add(listener);

  return () => {
    welcomeModalVisibilityListeners.delete(listener);
  };
}

/** Delay before starting the tour so the welcome dialog overlay can unmount first. */
export const WELCOME_MODAL_TOUR_START_DELAY_MS = 100;
