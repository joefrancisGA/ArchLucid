namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class CitationIntegritySlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    private const string OfflineCitationIntegrityManifestRelative =
        "fixtures/citation-integrity/offline-release-train-manifest.v1.json";

    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        CitationIntegrityOptions childOptions = new()
        {
            IncludeApi = context.Options.IncludeApi,
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
            ManifestPath = context.Options.IncludeApi
                ? null
                : Path.Combine(context.RepositoryRoot, OfflineCitationIntegrityManifestRelative),
        };
        CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(childOptions.RulesPath);
        CitationIntegrityRunner runner = new();
        CitationIntegrityReport report;

        if (childOptions.IncludeApi)
        {
            if (context.HttpClient is null)
                throw new InvalidOperationException("Citation integrity live API mode requires a configured HTTP client.");

            report = await runner.RunWithApiAsync(
                context.RepositoryRoot,
                context.HttpClient,
                childOptions,
                rules,
                cancellationToken);
        }
        else
        {
            report = runner.RunOffline(context.RepositoryRoot, childOptions, rules);
        }

        string artifactKey = CitationIntegrityOutputPaths.ResolveArtifactKey(report);
        CitationIntegrityOutputResolution outputPaths =
            CitationIntegrityOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        CitationIntegrityReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteCitationAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        string modeLabel = childOptions.IncludeApi ? "live-api" : "offline-fixture";

        return BuildSlotResult(
            PilotReadinessBundleSlots.CitationIntegrity,
            "Citation integrity",
            PilotReadinessBundleVerdictMapper.FromCitation(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; mode {modeLabel}; {finalReport.RunsWithFailIssues} run(s) with FAIL issues.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
