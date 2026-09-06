import { normalizeAuthMeResponse, type AuthMeResponse, type CurrentPrincipal } from "@/lib/current-principal";
import { ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION } from "@/lib/vendor-staff-principal";
import { ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY } from "@/lib/role-shaped-nav-density";

/** Browser cookie — overrides {@link isOperatorExperienceFullShellEnv} in local development only. */
export const DEV_SHELL_EXPERIENCE_COOKIE = "archlucid_dev_shell_experience_v1";

/** Browser cookie — overrides dev-bypass / mock `/me` role in local development only. */
export const DEV_ROLE_OVERRIDE_COOKIE = "archlucid_dev_role_override_v1";

/** Browser cookie — overrides host AgentExecution mode in local development only. */
export const DEV_AGENT_EXECUTION_MODE_COOKIE = "archlucid_dev_agent_execution_mode_v1";

/** Browser localStorage — hides the dev testing quick-switch panel without disabling other dev overrides. */
export const DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY = "archlucid_dev_quick_switch_panel_hidden_v1";

/** Matches upstream `ArchLucidAuthOptions.TestActorRoleHeader`. */
export const DEV_TEST_ACTOR_ROLE_HEADER = "X-ArchLucid-Test-Actor-Role";

/** Matches `DevAgentExecutionModeHeaderNames.Header` on the API host. */
export const DEV_AGENT_EXECUTION_MODE_HEADER = "X-ArchLucid-Dev-Agent-Execution-Mode";

export type DevShellExperienceOverride = "buyer-polished" | "full-operator";

export type DevRoleOverride = "Employee" | "Admin" | "Operator" | "Reader" | "Auditor";

/** API DevelopmentBypass role for the dev Employee persona (vendor staff / Internal Operations). */
export const DEV_EMPLOYEE_API_ACTOR_ROLE = "PlatformOperator";

export type DevAgentExecutionModeOverride = "Real" | "Simulator";

const DEV_SHELL_VALUES = new Set<string>(["buyer-polished", "full-operator"]);
const DEV_ROLE_VALUES = new Set<string>(["Employee", "Admin", "Operator", "Reader", "Auditor"]);
const DEV_AGENT_EXECUTION_MODE_VALUES = new Set<string>(["Real", "Simulator"]);

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

/** Dev-only affordances — never enabled in production bundles. */
export function isDevTestingOverridesEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (match === undefined) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
}

function writeCookieValue(name: string, value: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  if (value === null || value.trim().length === 0) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;

    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE_SEC}; Path=/; SameSite=Lax`;
}

export function parseDevShellExperienceOverride(raw: string | null | undefined): DevShellExperienceOverride | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "full-operator" || trimmed === "operator") {
    return "full-operator";
  }

  if (trimmed === "buyer-polished" || trimmed === "buyer") {
    return "buyer-polished";
  }

  return null;
}

export function parseDevRoleOverride(raw: string | null | undefined): DevRoleOverride | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!DEV_ROLE_VALUES.has(trimmed)) {
    return null;
  }

  return trimmed as DevRoleOverride;
}

export function parseDevAgentExecutionModeOverride(
  raw: string | null | undefined,
): DevAgentExecutionModeOverride | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (stringEqualsIgnoreCase(trimmed, "real") || stringEqualsIgnoreCase(trimmed, "live")) {
    return "Real";
  }

  if (stringEqualsIgnoreCase(trimmed, "simulator")) {
    return "Simulator";
  }

  if (DEV_AGENT_EXECUTION_MODE_VALUES.has(trimmed)) {
    return trimmed as DevAgentExecutionModeOverride;
  }

  return null;
}

/** Dev quick-switch default — Real API unless the operator explicitly picks Simulator. */
export function resolveEffectiveDevAgentExecutionMode(
  override: DevAgentExecutionModeOverride | null,
): DevAgentExecutionModeOverride {
  return override ?? "Real";
}

/** Effective mode for UI chrome when no explicit dev cookie override exists. */
export function resolveDevUiAgentExecutionMode(
  override: DevAgentExecutionModeOverride | null,
  hostAgentExecutionMode?: string | null,
): DevAgentExecutionModeOverride | null {
  if (override !== null) {
    return override;
  }

  if (hostAgentExecutionMode === "Simulator" || hostAgentExecutionMode === "Real") {
    return hostAgentExecutionMode;
  }

  return null;
}

export function readDevShellExperienceOverrideFromDocument(): DevShellExperienceOverride | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  return parseDevShellExperienceOverride(readCookieValue(DEV_SHELL_EXPERIENCE_COOKIE));
}

export function readDevRoleOverrideFromDocument(): DevRoleOverride | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  return parseDevRoleOverride(readCookieValue(DEV_ROLE_OVERRIDE_COOKIE));
}

export function readDevAgentExecutionModeOverrideFromDocument(): DevAgentExecutionModeOverride | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  return parseDevAgentExecutionModeOverride(readCookieValue(DEV_AGENT_EXECUTION_MODE_COOKIE));
}

export function readDevShellExperienceOverrideFromRequestCookies(
  cookieStore: CookieReader,
): DevShellExperienceOverride | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  return parseDevShellExperienceOverride(cookieStore.get(DEV_SHELL_EXPERIENCE_COOKIE)?.value);
}

export function readDevRoleOverrideFromRequestCookies(cookieStore: CookieReader): DevRoleOverride | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  return parseDevRoleOverride(cookieStore.get(DEV_ROLE_OVERRIDE_COOKIE)?.value);
}

export function readDevAgentExecutionModeOverrideFromRequestCookies(
  cookieStore: CookieReader,
): DevAgentExecutionModeOverride | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  return parseDevAgentExecutionModeOverride(cookieStore.get(DEV_AGENT_EXECUTION_MODE_COOKIE)?.value);
}

export function persistDevShellExperienceOverride(value: DevShellExperienceOverride | null): void {
  if (!isDevTestingOverridesEnabled()) {
    return;
  }

  writeCookieValue(DEV_SHELL_EXPERIENCE_COOKIE, value);
}

function persistDevRoleNavDensityShowFullNav(showFullNav: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ROLE_NAV_DENSITY_SHOW_FULL_NAV_STORAGE_KEY, showFullNav ? "true" : "false");
  } catch {
    // Ignore quota / private-mode failures — density falls back to collapsed defaults.
  }
}

/** Maps a dev quick-switch role to the DevelopmentBypass test-actor role header value. */
export function resolveDevRoleOverrideApiActorRole(role: DevRoleOverride): string {
  if (role === "Employee") {
    return DEV_EMPLOYEE_API_ACTOR_ROLE;
  }

  return role;
}

export function isDevEmployeeRoleOverrideActive(): boolean {
  return readDevRoleOverrideFromDocument() === "Employee";
}

export function persistDevRoleOverride(value: DevRoleOverride | null): void {
  if (!isDevTestingOverridesEnabled()) {
    return;
  }

  writeCookieValue(DEV_ROLE_OVERRIDE_COOKIE, value);

  if (value === "Employee") {
    // Employee is the "see everything" persona — expand role-shaped nav density and full-operator shell.
    persistDevRoleNavDensityShowFullNav(true);
    persistDevShellExperienceOverride("full-operator");
  }
}

export function persistDevAgentExecutionModeOverride(value: DevAgentExecutionModeOverride | null): void {
  if (!isDevTestingOverridesEnabled()) {
    return;
  }

  writeCookieValue(DEV_AGENT_EXECUTION_MODE_COOKIE, value);
}

export function reloadAfterDevTestingOverrideChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.reload();
}

export function readDevQuickSwitchPanelHiddenFromDocument(): boolean {
  if (!isDevTestingOverridesEnabled() || typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistDevQuickSwitchPanelHidden(hidden: boolean): void {
  if (!isDevTestingOverridesEnabled() || typeof window === "undefined") {
    return;
  }

  try {
    if (hidden) {
      window.localStorage.setItem(DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY);
    }
  } catch {
    // Ignore quota / private-mode failures — panel stays visible for this session.
  }
}

export function toggleDevQuickSwitchPanelHidden(): boolean {
  const nextHidden = !readDevQuickSwitchPanelHiddenFromDocument();

  persistDevQuickSwitchPanelHidden(nextHidden);

  return nextHidden;
}

export function cycleDevShellExperienceOverride(): DevShellExperienceOverride | null {
  const current = readDevShellExperienceOverrideFromDocument();
  let next: DevShellExperienceOverride | null;

  if (current === null) {
    next = "buyer-polished";
  } else if (current === "buyer-polished") {
    next = "full-operator";
  } else {
    next = null;
  }

  persistDevShellExperienceOverride(next);

  return next;
}

export function buildDevRoleOverrideAuthMeResponse(
  role: DevRoleOverride,
  base?: Pick<CurrentPrincipal, "name" | "hasCommittedArchitectureReview">,
): AuthMeResponse {
  if (role === "Employee") {
    return {
      name: base?.name ?? "Dev Employee",
      claims: [
        { type: "roles", value: DEV_EMPLOYEE_API_ACTOR_ROLE },
        { type: "permission", value: ARCHLUCID_VENDOR_STAFF_CROSS_TENANT_PERMISSION },
      ],
      hasCommittedArchitectureReview: base?.hasCommittedArchitectureReview ?? true,
    };
  }

  return {
    name: base?.name ?? `Dev ${role}`,
    claims: [{ type: "roles", value: role }],
    hasCommittedArchitectureReview: base?.hasCommittedArchitectureReview ?? true,
  };
}

/** Applies a dev role cookie on top of a real `/me` payload (UI + dev-bypass API shaping). */
export function applyDevRoleOverrideToPrincipal(principal: CurrentPrincipal): CurrentPrincipal {
  const roleOverride = readDevRoleOverrideFromDocument();

  if (roleOverride === null || !isDevTestingOverridesEnabled()) {
    return principal;
  }

  return normalizeAuthMeResponse(
    buildDevRoleOverrideAuthMeResponse(roleOverride, {
      name: principal.name,
      hasCommittedArchitectureReview: principal.hasCommittedArchitectureReview,
    }),
  );
}

export function isDevShellExperienceOverrideValue(value: string): value is DevShellExperienceOverride {
  return DEV_SHELL_VALUES.has(value);
}

export function isDevRoleOverrideValue(value: string): value is DevRoleOverride {
  return DEV_ROLE_VALUES.has(value);
}

export function isDevAgentExecutionModeOverrideValue(value: string): value is DevAgentExecutionModeOverride {
  return DEV_AGENT_EXECUTION_MODE_VALUES.has(value);
}

function stringEqualsIgnoreCase(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}
