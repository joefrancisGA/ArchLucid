import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findButtonVisibleBoundaryViolations } from "@/lib/button-visible-boundary-source-patterns";

const REPO_ROOT = join(process.cwd());

/** Shell, auth, and marketing surfaces from TB-2170 — ghost migration landed in TB-2168. */
const SHELL_AUTH_MARKETING_BUTTON_PATHS = [
  "src/components/SponsorShellFrame.tsx",
  "src/components/AppShellClient.tsx",
  "src/components/shell/OperatorShellTopBar.tsx",
  "src/components/shell/OperatorShellTopBarMoreMenu.tsx",
  "src/components/MobileNavDrawer.tsx",
  "src/components/ScopeSwitcher.tsx",
  "src/components/shell/AccountSettingsMenu.tsx",
  "src/components/marketing/MarketingPublicHeader.tsx",
  "src/components/sidebar-nav/SidebarNavLayoutSettingsPanel.tsx",
  "src/components/usability/NavPinnedLinksPanel.tsx",
  "src/app/(operator)/auth/signin/SignInEmailStep.tsx",
  "src/app/(operator)/auth/signin/SignInCodeStep.tsx",
  "src/app/(operator)/auth/signin/SignInSsoRequiredStep.tsx",
  "src/app/(operator)/auth/callback/AuthCallbackAccessPanel.tsx",
  "src/components/ui/welcome-modal.tsx",
  "src/components/marketing/HeroEarlyAccessCta.tsx",
  "src/app/(marketing)/live-demo/LiveDemoConversionCta.tsx",
] as const;

describe("shell / auth / marketing button visible-boundary guard (TB-2170)", () => {
  it.each(SHELL_AUTH_MARKETING_BUTTON_PATHS)(
    "does not emit ghost/link Button variants in %s",
    (relativePath) => {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      const violations = findButtonVisibleBoundaryViolations(source);

      expect(violations, `${relativePath}: use outline or OPERATOR_LINK per UI_DESIGN_SYSTEM.md § TB-2168`).toEqual([]);
    },
  );
});
