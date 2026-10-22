import { z } from "zod";

const emailSchema = z.string().trim().email();

/**
 * Gate for marketing capture CTAs. Reuses the same zod email rule as signup so a
 * single character no longer enables a primary submit.
 */
export function isSubmittableWorkEmail(value: string | null | undefined): boolean {
  if (value == null) {
    return false;
  }

  return emailSchema.safeParse(value).success;
}
