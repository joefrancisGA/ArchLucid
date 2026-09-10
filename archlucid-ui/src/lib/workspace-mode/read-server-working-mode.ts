import { cookies } from "next/headers";

import {
  BFF_SESSION_COOKIE_NAME,
  parseBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";

/** Server-side Working seat detection from the BFF session cookie (ADR 0077 / AO-06). */
export async function readServerWorkingModeFromBffSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(BFF_SESSION_COOKIE_NAME)?.value ?? "";
  const payload = parseBffSessionCookieValue(cookieValue);

  if (payload === null) {
    return true;
  }

  return payload.wm === 1;
}
