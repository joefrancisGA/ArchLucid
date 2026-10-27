/**
 * react-hook-form types array-field dirty/touched flags as nested arrays/objects, not a boolean.
 * Walk the nested map so a dirty list or attachment still counts as flagged.
 */
export function wizardFormStateFlagIsSet(flag: unknown): boolean {
  if (flag === true) {
    return true;
  }

  if (Array.isArray(flag)) {
    return flag.some((entry) => wizardFormStateFlagIsSet(entry));
  }

  if (flag !== null && typeof flag === "object") {
    return Object.values(flag).some((entry) => wizardFormStateFlagIsSet(entry));
  }

  return false;
}
