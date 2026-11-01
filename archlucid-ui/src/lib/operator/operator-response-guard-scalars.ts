import { z } from "zod";

/** Shared non-empty string guard for operator API coercion (trim + min length). */
export const operatorNonEmptyTrimmedString = z.string().trim().min(1);
