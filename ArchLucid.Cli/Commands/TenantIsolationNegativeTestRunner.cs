using System.Net;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestRunner
{
    private const string CorrelationHeaderName = "X-Correlation-ID";

    private static readonly Guid DefaultAlternateTenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid DefaultAlternateWorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid DefaultAlternateProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666");

    internal TenantIsolationNegativeTestReport RunOffline(string repositoryRoot, TenantIsolationNegativeTestOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);

        string manifestPath = ResolveManifestPath(repositoryRoot, options);
        TenantIsolationNegativeTestManifestDocument manifest = TenantIsolationNegativeTestManifestLoader.Load(manifestPath);
        List<TenantIsolationNegativeTestProbeResult> probes = manifest.Scenarios
            .SelectMany(scenario => scenario.Probes.Select(probe => EvaluateReplayProbe(scenario.Name, probe)))
            .ToList();

        return BuildReport(
            repositoryRoot,
            baseUrl: null,
            runId: manifest.PrimaryRunId,
            alternateTenantId: manifest.AlternateTenantId,
            alternateWorkspaceId: manifest.AlternateWorkspaceId,
            alternateProjectId: manifest.AlternateProjectId,
            liveApiMode: false,
            probes);
    }

    internal async Task<TenantIsolationNegativeTestReport> RunLiveAsync(
        string repositoryRoot,
        HttpClient primaryClient,
        HttpClient alternateClient,
        TenantIsolationNegativeTestOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
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

        if (primarySanity.Verdict == TenantIsolationNegativeTestVerdict.Fail)
        {
            return BuildReport(
                repositoryRoot,
                primaryClient.BaseAddress?.ToString()?.Trim().TrimEnd('/'),
                options.RunId,
                tenantId,
                workspaceId,
                projectId,
                liveApiMode: true,
                probes);
        }

        foreach (TenantIsolationNegativeTestProbeDefinition definition in TenantIsolationNegativeTestProbeCatalog.BuildLiveProbes(options.RunId))
        {
            TenantIsolationNegativeTestProbeResult probe = await ExecuteLiveProbeAsync(
                alternateClient,
                definition,
                options.RunId,
                cancellationToken);
            probes.Add(probe);
        }

        return BuildReport(
            repositoryRoot,
            primaryClient.BaseAddress?.ToString()?.Trim().TrimEnd('/'),
            options.RunId,
            tenantId,
            workspaceId,
            projectId,
            liveApiMode: true,
            probes);
    }

    internal static (string TenantId, string WorkspaceId, string ProjectId) ResolveAlternateScope(
        TenantIsolationNegativeTestOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string tenantId = options.AlternateTenantId ?? DefaultAlternateTenantId.ToString("D");
        string workspaceId = options.AlternateWorkspaceId ?? DefaultAlternateWorkspaceId.ToString("D");
        string projectId = options.AlternateProjectId ?? DefaultAlternateProjectId.ToString("D");

        return (tenantId, workspaceId, projectId);
    }

    private static TenantIsolationNegativeTestReport BuildReport(
        string repositoryRoot,
        string? baseUrl,
        string? runId,
        string? alternateTenantId,
        string? alternateWorkspaceId,
        string? alternateProjectId,
        bool liveApiMode,
        IReadOnlyList<TenantIsolationNegativeTestProbeResult> probes)
    {
        TenantIsolationNegativeTestVerdict overallVerdict =
            TenantIsolationNegativeTestAggregator.DeriveOverallVerdict(probes, liveApiMode);

        return new TenantIsolationNegativeTestReport
        {
            RepositoryRoot = repositoryRoot,
            BaseUrl = baseUrl,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overallVerdict,
            PrimaryRunId = runId,
            AlternateTenantId = alternateTenantId,
            AlternateWorkspaceId = alternateWorkspaceId,
            AlternateProjectId = alternateProjectId,
            LiveApiMode = liveApiMode,
            UnexpectedSuccessCount = TenantIsolationNegativeTestAggregator.CountUnexpectedSuccesses(probes),
            Probes = probes,
        };
    }

    private static TenantIsolationNegativeTestProbeResult EvaluateReplayProbe(
        string scenarioName,
        TenantIsolationNegativeTestManifestProbe probe)
    {
        TenantIsolationNegativeTestVerdict verdict;

        if (string.Equals(probe.ExpectedOutcome, "exclude-run-id", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(probe.Verdict, "skip", StringComparison.OrdinalIgnoreCase))
            {
                verdict = TenantIsolationNegativeTestVerdict.Skip;
            }
            else
            {
                verdict = EvaluateExcludeRunIdProbeVerdict(probe.ObservedStatusCode ?? 0, probe.ForeignRunIdVisible);
            }
        }
        else if (string.Equals(probe.Verdict, "skip", StringComparison.OrdinalIgnoreCase))
        {
            verdict = TenantIsolationNegativeTestVerdict.Skip;
        }
        else
        {
            verdict = TenantIsolationNegativeTestAggregator.EvaluateDenyStatus(probe.ObservedStatusCode ?? 0);
        }

        return new TenantIsolationNegativeTestProbeResult
        {
            Name = $"{scenarioName}:{probe.Name}",
            Path = probe.Path,
            ExpectedOutcome = probe.ExpectedOutcome,
            ObservedOutcome = probe.ObservedOutcome,
            ObservedStatusCode = probe.ObservedStatusCode,
            CorrelationId = probe.CorrelationId,
            Verdict = verdict,
            Evidence = probe.Evidence,
        };
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

    private static string ResolveManifestPath(string repositoryRoot, TenantIsolationNegativeTestOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.ManifestPath))
            return Path.GetFullPath(options.ManifestPath);

        return Path.Combine(repositoryRoot, "fixtures", "tenant-isolation", "negative-test-manifest.v1.json");
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

internal static class TenantIsolationNegativeTestManifestLoader
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static TenantIsolationNegativeTestManifestDocument Load(string manifestPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestPath);

        string json = File.ReadAllText(manifestPath);
        TenantIsolationNegativeTestManifestDocument? document =
            JsonSerializer.Deserialize<TenantIsolationNegativeTestManifestDocument>(json, JsonRead)
            ?? throw new InvalidOperationException($"Tenant isolation manifest is empty: {manifestPath}");

        if (document.Scenarios.Count == 0)
            throw new InvalidOperationException($"Tenant isolation manifest has no scenarios: {manifestPath}");

        return document;
    }
}

internal sealed class TenantIsolationNegativeTestManifestDocument
{
    public int SchemaVersion { get; init; }

    public string? PrimaryRunId { get; init; }

    public string? AlternateTenantId { get; init; }

    public string? AlternateWorkspaceId { get; init; }

    public string? AlternateProjectId { get; init; }

    public List<TenantIsolationNegativeTestManifestScenario> Scenarios { get; init; } = [];
}

internal sealed class TenantIsolationNegativeTestManifestScenario
{
    public string Name { get; init; } = string.Empty;

    public List<TenantIsolationNegativeTestManifestProbe> Probes { get; init; } = [];
}

internal sealed class TenantIsolationNegativeTestManifestProbe
{
    public string Name { get; init; } = string.Empty;

    public string Path { get; init; } = string.Empty;

    public string ExpectedOutcome { get; init; } = string.Empty;

    public string ObservedOutcome { get; init; } = string.Empty;

    public int? ObservedStatusCode { get; init; }

    public string? CorrelationId { get; init; }

    public string Evidence { get; init; } = string.Empty;

    public bool ForeignRunIdVisible { get; init; }

    public string? Verdict { get; init; }
}
