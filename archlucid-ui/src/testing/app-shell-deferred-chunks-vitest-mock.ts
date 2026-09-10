const nullDeferred = (): null => null;

/** Resolves app-shell deferred chunks to sync leaf modules for Vitest (TB-2118). */
export async function buildAppShellDeferredChunksVitestMock(): Promise<Record<string, unknown>> {
  const operatorShellTopBar = await import("@/components/shell/OperatorShellTopBar");
  const appShellWorkspaceFooter = await import("@/components/shell/AppShellWorkspaceFooter");
  const appShellIdleOverlays = await import("@/components/shell/AppShellIdleOverlays");
  const devTestingShellShortcuts = await import("@/components/dev-testing/DevTestingShellShortcuts");
  const appShellTelemetryBundle = await import("@/components/shell/AppShellTelemetryBundle");
  const authPanel = await import("@/components/AuthPanel");
  const syncActiveRunFromPathname = await import("@/components/SyncActiveRunFromPathname");
  const appShellMainContentGate = await import("@/components/shell/AppShellMainContentGate");
  const appShellKeyboardShortcutBoundary = await import("@/components/shell/AppShellKeyboardShortcutBoundary");
  const operatorShellAccessRedirectsHost = await import("@/components/shell/OperatorShellAccessRedirectsHost");
  const appToaster = await import("@/components/AppToaster");
  const routeAnnouncer = await import("@/components/RouteAnnouncer");
  const colorModeToggle = await import("@/components/ColorModeToggle");
  const authorityThemeToggle = await import("@/components/AuthorityThemeToggle");
  const shellThemePreferencesAppearanceVocabularyRail = await import(
    "@/components/ShellThemePreferencesAppearanceVocabularyRail"
  );
  const appShellStatusBanners = await import("@/components/shell/AppShellStatusBanners");
  const sidebarNav = await import("@/components/SidebarNav");
  const appShellMainAffordances = await import("@/components/shell/AppShellMainAffordances");
  const helpSearchPanel = await import("@/components/HelpSearchPanel");
  const helpPanel = await import("@/components/HelpPanel");

  return {
    OperatorShellTopBarDeferred: operatorShellTopBar.OperatorShellTopBar,
    AppShellWorkspaceFooterDeferred: appShellWorkspaceFooter.AppShellWorkspaceFooter,
    AppShellIdleOverlaysDeferred: appShellIdleOverlays.AppShellIdleOverlays,
    DevTestingShellShortcutsDeferred: devTestingShellShortcuts.DevTestingShellShortcuts,
    DevTestingQuickSwitchPanelDeferred: nullDeferred,
    AppShellTelemetryBundleDeferred: appShellTelemetryBundle.AppShellTelemetryBundle,
    AuthPanelDeferred: authPanel.AuthPanel,
    SyncActiveRunFromPathnameDeferred: syncActiveRunFromPathname.SyncActiveRunFromPathname,
    AppShellMainContentGateDeferred: appShellMainContentGate.AppShellMainContentGate,
    AppShellKeyboardShortcutBoundaryDeferred: appShellKeyboardShortcutBoundary.AppShellKeyboardShortcutBoundary,
    OperatorShellAccessRedirectsHostDeferred: operatorShellAccessRedirectsHost.OperatorShellAccessRedirectsHost,
    AppToasterDeferred: appToaster.AppToaster,
    RouteAnnouncerDeferred: routeAnnouncer.RouteAnnouncer,
    ColorModeToggleDeferred: colorModeToggle.ColorModeToggle,
    AuthorityThemeToggleDeferred: authorityThemeToggle.AuthorityThemeToggle,
    ShellThemePreferencesAppearanceVocabularyRailDeferred:
      shellThemePreferencesAppearanceVocabularyRail.ShellThemePreferencesAppearanceVocabularyRail,
    FrictionlessTrialBannerDeferred: nullDeferred,
    AppShellMainAffordancesDeferred: appShellMainAffordances.AppShellMainAffordances,
    OnboardingTourDeferred: nullDeferred,
    RegistrationOnboardingTourAutoStartDeferred: nullDeferred,
    HelpSearchPanelDeferred: helpSearchPanel.HelpSearchPanel,
    HelpPanelDeferred: helpPanel.HelpPanel,
    SidebarNavDeferred: sidebarNav.SidebarNav,
    AppShellStatusBannersDeferred: appShellStatusBanners.AppShellStatusBanners,
    TrialLimitModalHostDeferred: nullDeferred,
    CtoDemoJourneyCaptionBarDeferred: nullDeferred,
  };
}
