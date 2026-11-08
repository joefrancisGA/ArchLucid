export function resolveScopeGateOpenTransition(
  current: boolean,
  next: boolean | ((open: boolean) => boolean),
): { readonly resolved: boolean; readonly shouldSyncUrl: boolean } {
  const resolved = typeof next === "function" ? next(current) : next;

  return {
    resolved,
    shouldSyncUrl: current !== resolved,
  };
}
