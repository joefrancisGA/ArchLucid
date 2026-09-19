import type { LastRegistrationPayload } from "@/lib/registration-session";

const LAST_REGISTRATION_KEY = "archlucid_last_registration";

export function writeLastRegistrationPayloadForTests(payload: LastRegistrationPayload): void {
  sessionStorage.setItem(LAST_REGISTRATION_KEY, JSON.stringify(payload));
}
