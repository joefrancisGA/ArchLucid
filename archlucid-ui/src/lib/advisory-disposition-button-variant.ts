/**
 * Button chrome for advisory governance disposition actions (TB-1127).
 * Accept is the primary next step; other actions stay solid secondary (not pale outline/ghost).
 */
export function advisoryDispositionButtonVariant(
  action: string,
): "primary" | "secondary" {
  if (action === "Accept") {
    return "primary";
  }

  return "secondary";
}
