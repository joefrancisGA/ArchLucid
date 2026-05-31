/** Shared guards for pilot ROI baseline FAB, home card, and wizard chrome. */

export function suppressPilotRoiBaselineChrome(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_SUPPRESS_CORE_PILOT_WIZARD === "1") {
    return true;
  }

  const navigatorLike = window.navigator as Navigator & { webdriver?: boolean };

  if (navigatorLike.webdriver === true) {
    return true;
  }

  return false;
}
