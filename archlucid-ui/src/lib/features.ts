/**
 * Client-side feature flags for operator shell behavior.
 *
 * `features.showSystemAdministrationNav` — internal diagnostics, sales-ops, and employee tools
 * in the **System Administration** sidebar section. Deep links still work when the section is hidden.
 *
 * Env override (either name):
 * - `NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV=true|false|1|0`
 * - `NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR=true` (legacy alias for `true`)
 *
 * Defaults:
 * - **development** (`NODE_ENV=development`): **enabled** (local engineer builds)
 * - **production / customer-facing**: **disabled** unless env explicitly enables
 */
export type ArchLucidFeatureFlags = {
  readonly features: {
    readonly showSystemAdministrationNav: boolean;
  };
};

function parseTriStateBoolean(raw: string | undefined): boolean | undefined {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (normalized === "1" || normalized === "true") {
    return true;
  }

  if (normalized === "0" || normalized === "false") {
    return false;
  }

  return undefined;
}

function resolveShowSystemAdministrationNav(): boolean {
  const explicit =
    parseTriStateBoolean(process.env.NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV)
    ?? parseTriStateBoolean(process.env.NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR);

  if (explicit !== undefined) {
    return explicit;
  }

  return process.env.NODE_ENV === "development";
}

export function readArchLucidFeatureFlags(): ArchLucidFeatureFlags {
  return {
    features: {
      showSystemAdministrationNav: resolveShowSystemAdministrationNav(),
    },
  };
}

/** Whether the operator shell should render the System Administration nav section. */
export function isShowSystemAdministrationNavEnabled(): boolean {
  return readArchLucidFeatureFlags().features.showSystemAdministrationNav;
}
