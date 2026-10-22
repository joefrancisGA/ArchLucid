export const ARCHITECTURE_SHARE_ROLES = ["View", "Decide", "Admin"] as const;

export type ArchitectureShareRole = (typeof ARCHITECTURE_SHARE_ROLES)[number];

export function isArchitectureShareRole(value: string): value is ArchitectureShareRole {
  return (ARCHITECTURE_SHARE_ROLES as readonly string[]).includes(value);
}

export function normalizeArchitectureShareRole(value: string): ArchitectureShareRole {
  const trimmed = value.trim();

  if (isArchitectureShareRole(trimmed)) {
    return trimmed;
  }

  return "View";
}

export function resolveArchitectureShareGrantUserId(args: {
  pickerUserId: string;
}): { userId: string | null; isValid: boolean } {
  const userId = args.pickerUserId.trim();

  if (userId.length === 0) {
    return { userId: null, isValid: false };
  }

  return { userId, isValid: true };
}
