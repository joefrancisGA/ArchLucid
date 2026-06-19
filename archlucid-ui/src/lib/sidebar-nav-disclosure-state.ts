import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";

export type SidebarNavExpansionStateInput = {
  readonly pathname: string;
  readonly showExtended: boolean;
  readonly showAdvanced: boolean;
  readonly navDisclosurePathOverride: boolean;
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly ctoDemoNavExpandedEnv: boolean;
  readonly runtimeCtoDemoTourActive: boolean;
};

export type SidebarNavExpansionState = {
  readonly navExpanded: boolean;
  readonly navAdvanced: boolean;
  readonly shellShowExtended: boolean;
  readonly shellShowAdvanced: boolean;
  readonly ctoDemoNavExpanded: boolean;
};

/** Pure disclosure flags for sidebar tier filtering — extracted for unit tests and lighter re-renders. */
export function resolveSidebarNavExpansionState(
  input: SidebarNavExpansionStateInput,
): SidebarNavExpansionState {
  const { showExtended: shellShowExtended, showAdvanced: shellShowAdvanced } =
    input.navDisclosurePathOverride
      ? { showExtended: input.showExtended, showAdvanced: input.showAdvanced }
      : effectiveNavDisclosureForPathname(input.pathname, input.showExtended, input.showAdvanced);

  const ctoDemoNavExpanded =
    input.buyerPolishedShell && (input.ctoDemoNavExpandedEnv || input.runtimeCtoDemoTourActive);

  const navExpanded = ctoDemoNavExpanded
    ? true
    : input.buyerPolishedShell
      ? false
      : input.demoUi
        ? true
        : shellShowExtended;

  const navAdvanced = ctoDemoNavExpanded
    ? true
    : input.buyerPolishedShell
      ? false
      : input.demoUi
        ? true
        : shellShowAdvanced;

  return {
    navExpanded,
    navAdvanced,
    shellShowExtended,
    shellShowAdvanced,
    ctoDemoNavExpanded,
  };
}
