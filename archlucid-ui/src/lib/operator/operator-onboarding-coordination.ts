/** In-memory gate so the guided tour never renders while the welcome modal is visible. */
let welcomeModalVisible = false;

export function setWelcomeModalVisible(visible: boolean): void {
  welcomeModalVisible = visible;
}

export function isWelcomeModalVisible(): boolean {
  return welcomeModalVisible;
}

/** Delay before starting the tour so the welcome dialog overlay can unmount first. */
export const WELCOME_MODAL_TOUR_START_DELAY_MS = 100;
