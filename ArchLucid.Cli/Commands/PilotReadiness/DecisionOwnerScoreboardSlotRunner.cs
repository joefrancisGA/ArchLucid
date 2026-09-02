namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class DecisionOwnerScoreboardSlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        DecisionOwnerScoreboardOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        DecisionOwnerScoreboardRules rules = DecisionOwnerScoreboardRulesLoader.Load(childOptions.RulesPath);
        DecisionOwnerScoreboardRunner runner = new();
        DecisionOwnerScoreboardReport report = runner.Run(context.RepositoryRoot, childOptions, rules);
        string artifactKey = DecisionOwnerScoreboardOutputPaths.ResolveArtifactKey(report);
        DecisionOwnerScoreboardOutputResolution outputPaths =
            DecisionOwnerScoreboardOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        DecisionOwnerScoreboardReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath,
            outputPaths.SponsorMarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteDecisionOwnerAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.DecisionOwnerScoreboard,
            "Decision-owner scoreboard",
            PilotReadinessBundleVerdictMapper.FromDecisionOwner(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; {finalReport.Rows.Count} ledger row(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath,
            finalReport.SponsorMarkdownArtifactPath);
    }
}
