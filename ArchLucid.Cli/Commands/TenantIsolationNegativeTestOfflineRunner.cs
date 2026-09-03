using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class TenantIsolationNegativeTestOfflineRunner
{
    internal TenantIsolationNegativeTestOfflineRunResult Run(string repositoryRoot, TenantIsolationNegativeTestOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);

        string manifestPath = ResolveManifestPath(repositoryRoot, options);
        TenantIsolationNegativeTestManifestDocument manifest = TenantIsolationNegativeTestManifestLoader.Load(manifestPath);
        List<TenantIsolationNegativeTestProbeResult> probes = manifest.Scenarios
            .SelectMany(scenario => scenario.Probes.Select(probe => EvaluateReplayProbe(scenario.Name, probe)))
            .ToList();

        return new TenantIsolationNegativeTestOfflineRunResult(
            manifest.PrimaryRunId,
            manifest.AlternateTenantId,
            manifest.AlternateWorkspaceId,
            manifest.AlternateProjectId,
            probes);
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
}

internal sealed class TenantIsolationNegativeTestOfflineRunResult
{
    internal TenantIsolationNegativeTestOfflineRunResult(
        string? primaryRunId,
        string? alternateTenantId,
        string? alternateWorkspaceId,
        string? alternateProjectId,
        IReadOnlyList<TenantIsolationNegativeTestProbeResult> probes)
    {
        PrimaryRunId = primaryRunId;
        AlternateTenantId = alternateTenantId;
        AlternateWorkspaceId = alternateWorkspaceId;
        AlternateProjectId = alternateProjectId;
        Probes = probes;
    }

    internal string? PrimaryRunId
    {
        get;
    }

    internal string? AlternateTenantId
    {
        get;
    }

    internal string? AlternateWorkspaceId
    {
        get;
    }

    internal string? AlternateProjectId
    {
        get;
    }

    internal IReadOnlyList<TenantIsolationNegativeTestProbeResult> Probes
    {
        get;
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
