using ArchLucid.Core.Pagination;

namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestLiveRunner
{
    private const string CorrelationHeaderName = "X-Correlation-ID";

    private static readonly Guid DefaultAlternateTenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid DefaultAlternateWorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid DefaultAlternateProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666");

    internal static (string TenantId, string WorkspaceId, string ProjectId) ResolveAlternateScope(
        TenantIsolationNegativeTestOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string tenantId = options.AlternateTenantId ?? DefaultAlternateTenantId.ToString("D");
        string workspaceId = options.AlternateWorkspaceId ?? DefaultAlternateWorkspaceId.ToString("D");
        string projectId = options.AlternateProjectId ?? DefaultAlternateProjectId.ToString("D");

        return (tenantId, workspaceId, projectId);
    }

    internal static void ApplyAlternateScopeHeaders(HttpClient alternateClient, TenantIsolationNegativeTestOptions options)
    {
        ArgumentNullException.ThrowIfNull(alternateClient);
        ArgumentNullException.ThrowIfNull(options);

        (string tenantId, string workspaceId, string projectId) = ResolveAlternateScope(options);
        CliScopeHeaders.ApplyExplicit(alternateClient, tenantId, workspaceId, projectId);
    }

    internal async Task<TenantIsolationNegativeTestLiveRunResult> RunAsync(
        HttpClient primaryClient,
        HttpClient alternateClient,
        TenantIsolationNegativeTestOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(primaryClient);
        ArgumentNullException.ThrowIfNull(alternateClient);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentException.ThrowIfNullOrWhiteSpace(options.RunId);

        (string tenantId, string workspaceId, string projectId) = ResolveAlternateScope(options);
        List<TenantIsolationNegativeTestProbeResult> probes = new();

        TenantIsolationNegativeTestProbeResult primarySanity = await ProbePrimaryRunVisibilityAsync(
            primaryClient,
            options.RunId,
            cancellationToken);
        probes.Add(primarySanity);

        if (primarySanity.Verdict != TenantIsolationNegativeTestVerdict.Fail)
        {
            foreach (TenantIsolationNegativeTestProbeDefinition definition in TenantIsolationNegativeTestProbeCatalog.BuildLiveProbes(options.RunId))
            {
                TenantIsolationNegativeTestProbeResult probe = await ExecuteLiveProbeAsync(
                    alternateClient,
                    definition,
                    options.RunId,
                    cancellationToken);
                probes.Add(probe);
            }
        }

        return new TenantIsolationNegativeTestLiveRunResult(
            primaryClient.BaseAddress?.ToString()?.Trim().TrimEnd('/'),
            options.RunId,
            tenantId,
            workspaceId,
            projectId,
            probes);
    }

    private static async Task<TenantIsolationNegativeTestProbeResult> ProbePrimaryRunVisibilityAsync(
        HttpClient primaryClient,
        string runId,
        CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await primaryClient.GetAsync($"/v1/architecture/review/{runId}", cancellationToken);
        string body = await response.Content.ReadAsStringAsync(cancellationToken);
        TenantIsolationNegativeTestVerdict verdict = response.IsSuccessStatusCode
            ? TenantIsolationNegativeTestVerdict.Pass
            : TenantIsolationNegativeTestVerdict.Fail;

        return new TenantIsolationNegativeTestProbeResult
        {
            Name = "primary-scope-run-visible",
            Path = $"/v1/architecture/review/{runId}",
            ExpectedOutcome = "allow-status",
            ObservedOutcome = $"HTTP {(int)response.StatusCode}",
            ObservedStatusCode = (int)response.StatusCode,
            CorrelationId = ReadCorrelationId(response),
            Verdict = verdict,
            Evidence = verdict == TenantIsolationNegativeTestVerdict.Pass
                ? "Primary scope can read the supplied runId."
                : Trim(body),
        };
    }

    private static async Task<TenantIsolationNegativeTestProbeResult> ExecuteLiveProbeAsync(
        HttpClient alternateClient,
        TenantIsolationNegativeTestProbeDefinition definition,
        string runId,
        CancellationToken cancellationToken)
    {
        if (string.Equals(definition.ExpectedOutcome, "exclude-run-id", StringComparison.OrdinalIgnoreCase))
        {
            return await ExecuteExcludeRunIdProbeAsync(alternateClient, definition, runId, cancellationToken);
        }

        using HttpResponseMessage response = await alternateClient.GetAsync(definition.Path, cancellationToken);
        TenantIsolationNegativeTestVerdict verdict =
            TenantIsolationNegativeTestAggregator.EvaluateDenyStatus((int)response.StatusCode);
        string observedOutcome = $"HTTP {(int)response.StatusCode}";

        return new TenantIsolationNegativeTestProbeResult
        {
            Name = definition.Name,
            Path = definition.Path,
            ExpectedOutcome = definition.ExpectedOutcome,
            ObservedOutcome = observedOutcome,
            ObservedStatusCode = (int)response.StatusCode,
            CorrelationId = ReadCorrelationId(response),
            Verdict = verdict,
            Evidence = definition.Description,
        };
    }

    private static async Task<TenantIsolationNegativeTestProbeResult> ExecuteExcludeRunIdProbeAsync(
        HttpClient alternateClient,
        TenantIsolationNegativeTestProbeDefinition definition,
        string runId,
        CancellationToken cancellationToken)
    {
        (int statusCode, TenantIsolationNegativeTestRunListScanOutcome scanOutcome, string? correlationId) =
            await ScanRunListForForeignRunIdAsync(alternateClient, runId, cancellationToken);
        TenantIsolationNegativeTestVerdict verdict = EvaluateExcludeRunIdProbeVerdict(statusCode, scanOutcome);
        string observedOutcome = statusCode >= 500
            ? $"HTTP {statusCode}; skipped server error"
            : scanOutcome == TenantIsolationNegativeTestRunListScanOutcome.ListUnavailable
                ? $"HTTP {statusCode}; run list unavailable"
                : scanOutcome == TenantIsolationNegativeTestRunListScanOutcome.ScanIncomplete
                ? $"HTTP {statusCode}; scan incomplete before run list exhausted"
                : scanOutcome == TenantIsolationNegativeTestRunListScanOutcome.ForeignRunIdPresent
                    ? $"HTTP {statusCode}; foreign runId present"
                    : $"HTTP {statusCode}; foreign runId absent";

        return new TenantIsolationNegativeTestProbeResult
        {
            Name = definition.Name,
            Path = definition.Path,
            ExpectedOutcome = definition.ExpectedOutcome,
            ObservedOutcome = observedOutcome,
            ObservedStatusCode = statusCode,
            CorrelationId = correlationId,
            Verdict = verdict,
            Evidence = definition.Description,
        };
    }

    private static async Task<(int StatusCode, TenantIsolationNegativeTestRunListScanOutcome ScanOutcome, string? CorrelationId)> ScanRunListForForeignRunIdAsync(
        HttpClient alternateClient,
        string runId,
        CancellationToken cancellationToken)
    {
        const int maxPages = 50;
        string? cursor = null;
        int lastStatusCode = 0;
        string? lastCorrelationId = null;

        for (int pageIndex = 0; pageIndex < maxPages; pageIndex++)
        {
            string path = cursor is null
                ? $"/v1/runs?take={RunPagination.MaxTake}"
                : $"/v1/runs?take={RunPagination.MaxTake}&cursor={Uri.EscapeDataString(cursor)}";

            using HttpResponseMessage response = await alternateClient.GetAsync(path, cancellationToken);
            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            lastStatusCode = (int)response.StatusCode;
            lastCorrelationId = ReadCorrelationId(response);

            if (lastStatusCode >= 500)
                return (lastStatusCode, TenantIsolationNegativeTestRunListScanOutcome.ServerError, lastCorrelationId);

            if (lastStatusCode is < 200 or >= 300)
                return (lastStatusCode, TenantIsolationNegativeTestRunListScanOutcome.ListUnavailable, lastCorrelationId);

            if (TenantIsolationNegativeTestAggregator.TryFindRunIdInRunList(body, runId))
                return (lastStatusCode, TenantIsolationNegativeTestRunListScanOutcome.ForeignRunIdPresent, lastCorrelationId);

            if (!TenantIsolationNegativeTestAggregator.TryParseRunListContinuation(body, out cursor))
                return (lastStatusCode, TenantIsolationNegativeTestRunListScanOutcome.ForeignRunIdAbsent, lastCorrelationId);

            if (pageIndex == maxPages - 1)
                return (lastStatusCode, TenantIsolationNegativeTestRunListScanOutcome.ScanIncomplete, lastCorrelationId);
        }

        return (lastStatusCode, TenantIsolationNegativeTestRunListScanOutcome.ForeignRunIdAbsent, lastCorrelationId);
    }

    private static TenantIsolationNegativeTestVerdict EvaluateExcludeRunIdProbeVerdict(
        int statusCode,
        TenantIsolationNegativeTestRunListScanOutcome scanOutcome)
    {
        if (statusCode >= 500
            || scanOutcome == TenantIsolationNegativeTestRunListScanOutcome.ScanIncomplete
            || scanOutcome == TenantIsolationNegativeTestRunListScanOutcome.ListUnavailable)
            return TenantIsolationNegativeTestVerdict.Skip;

        return scanOutcome == TenantIsolationNegativeTestRunListScanOutcome.ForeignRunIdPresent
            ? TenantIsolationNegativeTestVerdict.Fail
            : TenantIsolationNegativeTestVerdict.Pass;
    }

    private static string? ReadCorrelationId(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues(CorrelationHeaderName, out IEnumerable<string>? values))
            return values.FirstOrDefault();

        return null;
    }

    private static string Trim(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "(empty)";

        string singleLine = value.Replace(Environment.NewLine, " ", StringComparison.Ordinal);

        return singleLine.Length <= 240 ? singleLine : singleLine[..240] + "…";
    }
}

internal sealed class TenantIsolationNegativeTestLiveRunResult
{
    internal TenantIsolationNegativeTestLiveRunResult(
        string? baseUrl,
        string runId,
        string alternateTenantId,
        string alternateWorkspaceId,
        string alternateProjectId,
        IReadOnlyList<TenantIsolationNegativeTestProbeResult> probes)
    {
        BaseUrl = baseUrl;
        RunId = runId;
        AlternateTenantId = alternateTenantId;
        AlternateWorkspaceId = alternateWorkspaceId;
        AlternateProjectId = alternateProjectId;
        Probes = probes;
    }

    internal string? BaseUrl
    {
        get;
    }

    internal string RunId
    {
        get;
    }

    internal string AlternateTenantId
    {
        get;
    }

    internal string AlternateWorkspaceId
    {
        get;
    }

    internal string AlternateProjectId
    {
        get;
    }

    internal IReadOnlyList<TenantIsolationNegativeTestProbeResult> Probes
    {
        get;
    }
}
