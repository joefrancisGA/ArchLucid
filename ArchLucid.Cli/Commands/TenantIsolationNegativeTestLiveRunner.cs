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
        using HttpResponseMessage response = await alternateClient.GetAsync(definition.Path, cancellationToken);
        string body = await response.Content.ReadAsStringAsync(cancellationToken);
        TenantIsolationNegativeTestVerdict verdict;
        string observedOutcome;

        if (string.Equals(definition.ExpectedOutcome, "exclude-run-id", StringComparison.OrdinalIgnoreCase))
        {
            int statusCode = (int)response.StatusCode;
            bool containsRunId = TenantIsolationNegativeTestAggregator.TryFindRunIdInRunList(body, runId);
            verdict = EvaluateExcludeRunIdProbeVerdict(statusCode, containsRunId);
            observedOutcome = statusCode >= 500
                ? $"HTTP {statusCode}; skipped server error"
                : containsRunId
                    ? $"HTTP {statusCode}; foreign runId present"
                    : $"HTTP {statusCode}; foreign runId absent";
        }
        else
        {
            verdict = TenantIsolationNegativeTestAggregator.EvaluateDenyStatus((int)response.StatusCode);
            observedOutcome = $"HTTP {(int)response.StatusCode}";
        }

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

    private static TenantIsolationNegativeTestVerdict EvaluateExcludeRunIdProbeVerdict(int statusCode, bool foreignRunIdVisible)
    {
        if (statusCode >= 500)
            return TenantIsolationNegativeTestVerdict.Skip;

        return foreignRunIdVisible
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
