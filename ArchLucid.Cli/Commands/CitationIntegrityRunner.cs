using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed class CitationIntegrityRunner
{
    internal CitationIntegrityReport RunOffline(
        string repositoryRoot,
        CitationIntegrityOptions options,
        CitationIntegrityRules rules)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rules);

        string manifestPath = ResolveManifestPath(repositoryRoot, options);
        IReadOnlyList<CitationIntegrityRunBundle> candidates = CitationIntegrityManifestLoader.Load(manifestPath);
        int sampleSize = options.SampleSize ?? rules.DefaultSampleSize;
        int failThreshold = options.FailThreshold ?? rules.FailThresholdDefault;

        return BuildReport(
            repositoryRoot,
            baseUrl: null,
            candidates,
            sampleSize,
            failThreshold,
            rules);
    }

    internal async Task<CitationIntegrityReport> RunWithApiAsync(
        string repositoryRoot,
        HttpClient http,
        CitationIntegrityOptions options,
        CitationIntegrityRules rules,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rules);

        IReadOnlyList<CitationIntegrityRunBundle> candidates = await LoadCommittedRunsFromApiAsync(http, cancellationToken);
        int sampleSize = options.SampleSize ?? rules.DefaultSampleSize;
        int failThreshold = options.FailThreshold ?? rules.FailThresholdDefault;
        string? baseUrl = http.BaseAddress?.ToString()?.Trim().TrimEnd('/');

        return BuildReport(
            repositoryRoot,
            baseUrl,
            candidates,
            sampleSize,
            failThreshold,
            rules);
    }

    private static CitationIntegrityReport BuildReport(
        string repositoryRoot,
        string? baseUrl,
        IReadOnlyList<CitationIntegrityRunBundle> candidates,
        int sampleSize,
        int failThreshold,
        CitationIntegrityRules rules)
    {
        IReadOnlyList<CitationIntegrityRunBundle> sampled = CitationIntegritySampler.SelectDeterministic(candidates, sampleSize);
        List<CitationIntegrityRunResult> runResults = sampled
            .Select(bundle => CitationIntegrityEvaluator.EvaluateRun(bundle, rules))
            .ToList();

        int runsWithFailIssues = runResults.Count(static result => result.Verdict == CitationIntegrityVerdict.Fail);
        CitationIntegrityVerdict overallVerdict = DeriveOverallVerdict(runResults, runsWithFailIssues, failThreshold);

        return new CitationIntegrityReport
        {
            RepositoryRoot = repositoryRoot,
            BaseUrl = baseUrl,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overallVerdict,
            SampleSize = sampled.Count,
            CommittedRunsConsidered = candidates.Count(static bundle => bundle.Status == ArchitectureRunStatus.Committed),
            RunsWithFailIssues = runsWithFailIssues,
            FailThreshold = failThreshold,
            Runs = runResults,
        };
    }

    private static CitationIntegrityVerdict DeriveOverallVerdict(
        IReadOnlyList<CitationIntegrityRunResult> runResults,
        int runsWithFailIssues,
        int failThreshold)
    {
        if (runsWithFailIssues >= failThreshold)
            return CitationIntegrityVerdict.Fail;

        if (runResults.Any(static result => result.Verdict == CitationIntegrityVerdict.Warn))
            return CitationIntegrityVerdict.Warn;

        return CitationIntegrityVerdict.Pass;
    }

    private static string ResolveManifestPath(string repositoryRoot, CitationIntegrityOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.ManifestPath))
            return Path.GetFullPath(options.ManifestPath);

        string fixturesDirectory = string.IsNullOrWhiteSpace(options.FixturesDirectory)
            ? Path.Combine(repositoryRoot, "fixtures", "citation-integrity")
            : Path.GetFullPath(options.FixturesDirectory);

        return Path.Combine(fixturesDirectory, "manifest.v1.json");
    }

    private static async Task<IReadOnlyList<CitationIntegrityRunBundle>> LoadCommittedRunsFromApiAsync(
        HttpClient http,
        CancellationToken cancellationToken)
    {
        ArchLucidApiClient apiClient = new(http);
        List<CitationIntegrityRunBundle> bundles = new();

        using HttpResponseMessage listResponse = await http.GetAsync("/v1/runs?limit=100", cancellationToken);

        if (listResponse.StatusCode != HttpStatusCode.OK)
            return bundles;

        string listJson = await listResponse.Content.ReadAsStringAsync(cancellationToken);
        using JsonDocument listDoc = JsonDocument.Parse(listJson);
        JsonElement root = listDoc.RootElement;

        if (!root.TryGetProperty("items", out JsonElement items) || items.ValueKind != JsonValueKind.Array)
            return bundles;

        foreach (JsonElement item in items.EnumerateArray())
        {
            if (!item.TryGetProperty("status", out JsonElement statusElement))
                continue;

            string? statusRaw = statusElement.GetString();

            if (!string.Equals(statusRaw, ArchitectureRunStatus.Committed.ToString(), StringComparison.OrdinalIgnoreCase))
                continue;

            if (!item.TryGetProperty("runId", out JsonElement runIdElement))
                continue;

            string? runId = runIdElement.GetString();

            if (string.IsNullOrWhiteSpace(runId))
                continue;

            ArchLucidApiClient.GetRunResult? run = await apiClient.GetRunAsync(runId, cancellationToken);

            if (run is null)
                continue;

            List<AgentResult> agentResults = CitationIntegrityAgentResultParser.Parse(run.Results);

            bundles.Add(new CitationIntegrityRunBundle
            {
                RunId = runId,
                Status = ArchitectureRunStatus.Committed,
                AgentResults = agentResults,
            });
        }

        return bundles;
    }
}
