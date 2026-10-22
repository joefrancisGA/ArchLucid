using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

public sealed partial class TrialSmokeRunner
{
    private async Task<(TrialSmokeStepResult Step, TrialSmokeRegisterResponse? Body, string? CorrelationId)>
        RegisterAsync(TrialSmokeCommandOptions options, CancellationToken ct)
    {
        const string name = "register";
        const string hint = "Look for TrialSignupAttempted / TrialSignupFailed in dbo.AuditEvents.";

        TrialSmokeRegisterRequest payload = new()
        {
            OrganizationName = options.OrganizationName,
            AdminEmail = options.AdminEmail,
            AdminDisplayName = options.AdminDisplayName,
            BaselineReviewCycleHours = options.BaselineReviewCycleHours,
            BaselineReviewCycleSource = options.BaselineReviewCycleSource
        };

        try
        {
            using HttpResponseMessage res = await _http.PostAsJsonAsync("/v1/register", payload, ContractJson.CamelCaseIgnoreNullCompactCaseInsensitive, ct);
            string? correlationId = ReadCorrelationId(res);

            if (res.StatusCode != HttpStatusCode.Created)
            {
                string body = await res.Content.ReadAsStringAsync(ct);

                return (
                    new TrialSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail = $"POST /v1/register returned {(int)res.StatusCode}. Body: {Truncate(body, 240)}",
                        FailureHint = hint
                    }, null, correlationId);
            }

            TrialSmokeRegisterResponse? body200 =
                await res.Content.ReadFromJsonAsync<TrialSmokeRegisterResponse>(ContractJson.CamelCaseIgnoreNullCompactCaseInsensitive, ct);

            if (body200 is null || string.IsNullOrWhiteSpace(body200.TenantId))
                return (
                    new TrialSmokeStepResult
                    {
                        Name = name,
                        Passed = false,
                        Detail = "POST /v1/register returned 201 but the response body did not contain a tenantId.",
                        FailureHint = hint
                    }, null, correlationId);

            return (
                new TrialSmokeStepResult { Name = name, Passed = true, Detail = $"POST /v1/register → 201 (tenantId={body200.TenantId})." }, body200,
                correlationId);
        }
        catch (Exception ex)
        {
            return (
                new TrialSmokeStepResult
                {
                    Name = name,
                    Passed = false,
                    Detail = $"POST /v1/register threw: {ex.GetType().Name}: {ex.Message}",
                    FailureHint = hint
                }, null, null);
        }
    }

    private static string? ReadCorrelationId(HttpResponseMessage res)
    {
        return res.Headers.TryGetValues(CorrelationHeaderName, out IEnumerable<string>? values)
            ? (from v in values where !string.IsNullOrWhiteSpace(v) select v.Trim()).FirstOrDefault()
            : null;
    }
}
