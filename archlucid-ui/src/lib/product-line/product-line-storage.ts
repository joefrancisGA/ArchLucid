import {
  isProductLineAssignment,
  type ProductLineAssignment,
} from "@/lib/product-line/product-line-assignment";
import { isProductLineId, type ProductLineId } from "@/lib/product-line/product-line-id";

/** Browser cookie — overrides {@link resolveProductLineIdFromEnv} without a rebuild. */
export const PRODUCT_LINE_COOKIE = "archlucid_product_line_v1";

/** Browser localStorage — per-href assignment overlays for the product-line playground. */
export const PRODUCT_LINE_ASSIGNMENT_OVERRIDES_STORAGE_KEY = "archlucid_product_line_assignment_overrides_v1";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (match === undefined) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
}

function writeCookieValue(name: string, value: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  if (value === null || value.trim().length === 0) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;

    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE_SEC}; Path=/; SameSite=Lax`;
}

export function readProductLineCookie(): ProductLineId | null {
  const raw = readCookieValue(PRODUCT_LINE_COOKIE);

  if (!isProductLineId(raw)) {
    return null;
  }

  return raw;
}

export function persistProductLineCookie(productLine: ProductLineId | null): void {
  writeCookieValue(PRODUCT_LINE_COOKIE, productLine);
}

export function readProductLineAssignmentOverrides(): Readonly<Record<string, ProductLineAssignment>> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(PRODUCT_LINE_ASSIGNMENT_OVERRIDES_STORAGE_KEY);

  if (raw === null || raw.trim().length === 0) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const out: Record<string, ProductLineAssignment> = {};

    for (const [href, assignment] of Object.entries(parsed)) {
      if (typeof href !== "string" || href.trim().length === 0) {
        continue;
      }

      if (!isProductLineAssignment(assignment)) {
        continue;
      }

      out[href] = assignment;
    }

    return out;
  } catch {
    return {};
  }
}

export function persistProductLineAssignmentOverrides(
  overrides: Readonly<Record<string, ProductLineAssignment>>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PRODUCT_LINE_ASSIGNMENT_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

export function clearProductLineAssignmentOverrides(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PRODUCT_LINE_ASSIGNMENT_OVERRIDES_STORAGE_KEY);
}
