namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class FrontierAiBaselineSlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        FrontierAiBaselineOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        FrontierAiBaselineRunner runner = new();
        FrontierAiBaselineReport report = runner.Run(context.RepositoryRoot, childOptions);
        string artifactKey = FrontierAiBaselineOutputPaths.ResolveArtifactKey(report);
        FrontierAiBaselineOutputResolution outputPaths =
            FrontierAiBaselineOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        FrontierAiBaselineReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteFrontierAiAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.FrontierAiBaseline,
            "Frontier-AI baseline",
            PilotReadinessBundleVerdictMapper.FromFrontierAi(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; scoreboard `{finalReport.ScoreboardPath}`.",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
