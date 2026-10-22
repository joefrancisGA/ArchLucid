using System.Globalization;
using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

public sealed partial class TrialSmokeRunner
{
    private async Task<(TrialSmokeStepResult Step, TrialSmokeTrialStatusResponse? Body)> TrialStatusAsync(
        TrialSmokeRegisterResponse register,
        CancellationToken ct)
    {
        const string name = "trial-status";
        const string hint = "Look for TrialProvisioned in dbo.AuditEvents and confirm the tenant row in dbo.Tenants.";

        try
        {
            using HttpRequestMessage req = new(HttpMethod.Get, "/v1/tenant/trial-status");
            ApplyRegistrationScope(req, register);

            using HttpResponseMessage res = await _http.SendAsync(req, ct);

            if (res.StatusCode != HttpStatusCode.OK)
            {
                string body = await res.Content.ReadAsStringAsync(ct);

                return (
                    new TrialSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail =
                            $"GET /v1/tenant/trial-status returned {(int)res.StatusCode}. Body: {Truncate(body, 240)}",
                        FailureHint = hint
                    }, null);
            }

            TrialSmokeTrialStatusResponse? body200 =
                await res.Content.ReadFromJsonAsync<TrialSmokeTrialStatusResponse>(ContractJson.CamelCaseIgnoreNullCompactCaseInsensitive, ct);

            if (body200 is null)
                return (
                    new TrialSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail = "GET /v1/tenant/trial-status returned 200 with an empty/invalid JSON body.",
                        FailureHint = hint
                    }, null);

            return (
                new TrialSmokeStepResult
                {
                    Name = name,
                    Passed = true,
                    Detail =
                        $"GET /v1/tenant/trial-status → 200 (status={body200.Status}, welcomeRunId={body200.TrialWelcomeRunId ?? "<none>"})."
                }, body200);
        }
        catch (Exception ex)
        {
            return (
                new TrialSmokeStepResult
                {
                    Name = name,
                    Passed = false,
                    Detail = $"GET /v1/tenant/trial-status threw: {ex.GetType().Name}: {ex.Message}",
                    FailureHint = hint
                }, null);
        }
    }

    private async Task<TrialSmokeStepResult> PilotRunDeltasAsync(
        TrialSmokeRegisterResponse register,
        string trialWelcomeRunId,
        CancellationToken ct)
    {
        const string name = "pilot-run-deltas";
        const string hint =
            "Look for Run.CommitCompleted in dbo.AuditEvents.";

        try
        {
            string path = $"/v1/pilots/runs/{Uri.EscapeDataString(trialWelcomeRunId)}/pilot-run-deltas";
            using HttpRequestMessage req = new(HttpMethod.Get, path);
            ApplyRegistrationScope(req, register);

            using HttpResponseMessage res = await _http.SendAsync(req, ct);

            if (res.StatusCode != HttpStatusCode.OK)
            {
                string body = await res.Content.ReadAsStringAsync(ct);

                return new TrialSmokeStepResult
                {
                    Name = name,
                    Passed = false,
                    Detail = $"GET {path} returned {(int)res.StatusCode}. Body: {Truncate(body, 240)}",
                    FailureHint = hint
                };
            }

            TrialSmokePilotRunDeltasShape? body200 =
                await res.Content.ReadFromJsonAsync<TrialSmokePilotRunDeltasShape>(ContractJson.CamelCaseIgnoreNullCompactCaseInsensitive, ct);
            string seconds = body200?.TimeToCommittedManifestTotalSeconds is { } s
                ? s.ToString("0.##", CultureInfo.InvariantCulture)
                : "<null>";

            return new TrialSmokeStepResult { Name = name, Passed = true, Detail = $"GET {path} → 200 (timeToCommittedManifestTotalSeconds={seconds})." };
        }
        catch (Exception ex)
        {
            return new TrialSmokeStepResult
            {
                Name = name,
                Passed = false,
                Detail = $"GET pilot-run-deltas threw: {ex.GetType().Name}: {ex.Message}",
                FailureHint = hint
            };
        }
    }

    private static void ApplyRegistrationScope(HttpRequestMessage req, TrialSmokeRegisterResponse register)
    {
        if (!string.IsNullOrWhiteSpace(register.TenantId))
            req.Headers.TryAddWithoutValidation("X-Tenant-Id", register.TenantId);

        if (!string.IsNullOrWhiteSpace(register.DefaultWorkspaceId))
            req.Headers.TryAddWithoutValidation("X-Workspace-Id", register.DefaultWorkspaceId);

        if (!string.IsNullOrWhiteSpace(register.DefaultProjectId))
            req.Headers.TryAddWithoutValidation("X-Project-Id", register.DefaultProjectId);
    }
}
