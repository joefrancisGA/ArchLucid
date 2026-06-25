namespace ArchLucid.Cli.Commands;

internal static class PilotInitAuthTokenSteps
{
    internal static PilotPreflightStepResult Skipped(string reason) =>
        new()
        {
            Name = "auth:test-token",
            Disposition = PilotPreflightDisposition.Warn,
            Detail = reason,
            Remediation = "Re-run with --bearer <jwt> or answer the token prompt during `archlucid pilot init`.",
        };

    internal static PilotPreflightStepResult FromOutcome(AuthTokenClaimsDiagnosticOutcome outcome)
    {
        if (outcome.IsMissingApiKey)
        {
            return new PilotPreflightStepResult
            {
                Name = "auth:test-token",
                Disposition = PilotPreflightDisposition.Block,
                Detail = outcome.ErrorDetail ?? "Missing ARCHLUCID_API_KEY.",
                Remediation =
                    "Export ARCHLUCID_API_KEY with AdminAuthority, then rerun `archlucid pilot init --bearer <jwt>`.",
            };
        }

        if (!outcome.IsSuccess)
        {
            return new PilotPreflightStepResult
            {
                Name = "auth:test-token",
                Disposition = PilotPreflightDisposition.Block,
                Detail = outcome.ErrorDetail ?? "Token diagnostic failed.",
                Remediation =
                    "Confirm API reachability and admin key scope; see docs/runbooks/GENERIC_OIDC_SETUP.md.",
            };
        }

        int roleCount = outcome.Response!.ResolvedRoles.Count;

        if (roleCount == 0)
        {
            return new PilotPreflightStepResult
            {
                Name = "auth:test-token",
                Disposition = PilotPreflightDisposition.Block,
                Detail = "No ArchLucid roles resolved from bearer token role claims.",
                Remediation =
                    "Map IdP group claims to ArchLucid roles — see docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md.",
            };
        }

        string roles = string.Join(", ", outcome.Response.ResolvedRoles);

        return new PilotPreflightStepResult
        {
            Name = "auth:test-token",
            Disposition = PilotPreflightDisposition.Pass,
            Detail = $"Resolved {roleCount} role(s): {roles}",
        };
    }
}
