import type { components } from "@/lib/openapi-schemas";

export type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];

export type AuthBetaReadinessInviteBlocker = {
  readonly id: "operator-base-url" | "invite-session-signing";
  readonly label: string;
  readonly detail: string;
};

/** Returns invite-wave blockers when auth configuration diagnostics are incomplete (TB-928). */
export function resolveAuthBetaReadinessInviteBlockers(
  config: AdminAuthConfigurationDiagnosticsResponse | null | undefined,
): AuthBetaReadinessInviteBlocker[] {
  if (config === null || config === undefined) {
    return [];
  }

  const blockers: AuthBetaReadinessInviteBlocker[] = [];

  if (config.operatorBaseUrlConfigured !== true) {
    blockers.push({
      id: "operator-base-url",
      label: "Invite email base URL",
      detail:
        "Set the operator UI origin so invitation emails include a clickable accept link before private-beta invitees can complete sign-in.",
    });
  }

  if (config.localTrialIdentityConfigured !== true) {
    blockers.push({
      id: "invite-session-signing",
      label: "Invite session signing",
      detail:
        "Configure invite-accept session signing so accepted invitations can mint API sessions for private-beta users.",
    });
  }

  return blockers;
}
