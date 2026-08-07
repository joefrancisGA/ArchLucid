using System.Net;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static class TenantIsolationNegativeTestAggregator
{
    internal static TenantIsolationNegativeTestVerdict EvaluateDenyStatus(int statusCode)
    {
        if (statusCode is (int)HttpStatusCode.NotFound or (int)HttpStatusCode.Forbidden or (int)HttpStatusCode.Unauthorized)
            return TenantIsolationNegativeTestVerdict.Pass;

        if (statusCode >= 500)
            return TenantIsolationNegativeTestVerdict.Skip;

        return TenantIsolationNegativeTestVerdict.Fail;
    }

    internal static TenantIsolationNegativeTestVerdict EvaluateListExclusion(bool containsForeignRunId)
    {
        return containsForeignRunId
            ? TenantIsolationNegativeTestVerdict.Fail
            : TenantIsolationNegativeTestVerdict.Pass;
    }

    internal static TenantIsolationNegativeTestVerdict DeriveOverallVerdict(IReadOnlyList<TenantIsolationNegativeTestProbeResult> probes)
    {
        if (probes.Any(static probe => probe.Verdict == TenantIsolationNegativeTestVerdict.Fail))
            return TenantIsolationNegativeTestVerdict.Fail;

        if (probes.Count == 0 || probes.All(static probe => probe.Verdict == TenantIsolationNegativeTestVerdict.Skip))
            return TenantIsolationNegativeTestVerdict.Skip;

        return TenantIsolationNegativeTestVerdict.Pass;
    }

    internal static int CountUnexpectedSuccesses(IReadOnlyList<TenantIsolationNegativeTestProbeResult> probes)
    {
        return probes.Count(static probe => probe.Verdict == TenantIsolationNegativeTestVerdict.Fail);
    }

    internal static bool TryFindRunIdInRunList(string json, string runId)
    {
        if (string.IsNullOrWhiteSpace(json) || string.IsNullOrWhiteSpace(runId))
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;

            if (root.ValueKind == JsonValueKind.Array)
                return ArrayContainsRunId(root, runId);

            if (root.TryGetProperty("items", out JsonElement items) && items.ValueKind == JsonValueKind.Array)
                return ArrayContainsRunId(items, runId);
        }
        catch (JsonException)
        {
            return json.Contains(runId, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static bool ArrayContainsRunId(JsonElement array, string runId)
    {
        foreach (JsonElement item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
                continue;

            if (item.TryGetProperty("runId", out JsonElement runIdElement)
                && string.Equals(runIdElement.GetString(), runId, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}

internal static class TenantIsolationNegativeTestProbeCatalog
{
    internal static IReadOnlyList<TenantIsolationNegativeTestProbeDefinition> BuildLiveProbes(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return
        [
            new TenantIsolationNegativeTestProbeDefinition(
                "cross-tenant-run-get",
                $"/v1/architecture/review/{runId}",
                "deny-status",
                "Cross-tenant GET run detail must not succeed."),
            new TenantIsolationNegativeTestProbeDefinition(
                "cross-tenant-run-roi",
                $"/v1/architecture/review/{runId}/roi",
                "deny-status",
                "Cross-tenant GET run ROI must not succeed."),
            new TenantIsolationNegativeTestProbeDefinition(
                "cross-tenant-run-provenance",
                $"/v1/architecture/reviews/{runId}/provenance",
                "deny-status",
                "Cross-tenant GET run provenance must not succeed."),
            new TenantIsolationNegativeTestProbeDefinition(
                "cross-tenant-run-artifacts",
                $"/v1/artifacts/runs/{runId}",
                "deny-status",
                "Cross-tenant GET run artifacts must not succeed."),
            new TenantIsolationNegativeTestProbeDefinition(
                "cross-tenant-run-export",
                $"/v1/artifacts/runs/{runId}/export",
                "deny-status",
                "Cross-tenant GET run export must not succeed."),
            new TenantIsolationNegativeTestProbeDefinition(
                "cross-tenant-run-list",
                "/v1/runs?limit=200",
                "exclude-run-id",
                "Cross-tenant run list must not include the foreign runId."),
        ];
    }
}

internal sealed record TenantIsolationNegativeTestProbeDefinition(
    string Name,
    string Path,
    string ExpectedOutcome,
    string Description);
