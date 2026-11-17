import { z } from "zod";

/** Shared non-empty string guard for operator API coercion (trim + min length). */
export const operatorNonEmptyTrimmedString = z.string().trim().min(1);

/** Manifest and list counters from Authority — non-negative integers only. */
export const operatorNonNegativeInteger = z.number().finite().int().min(0);
