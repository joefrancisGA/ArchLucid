namespace ArchLucid.Cli.Commands.PilotReadiness;

internal sealed class BuyerProofEvidenceLedgerSlotRunner : PilotReadinessSlotRunnerBase, IPilotReadinessSlotRunner
{
    public async Task<PilotReadinessBundleSlotResult> RunAsync(
        PilotReadinessSlotRunContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        BuyerProofEvidenceLedgerOptions childOptions = new()
        {
            SuppressDefaultArtifacts = context.Options.SuppressDefaultArtifacts,
        };
        BuyerProofEvidenceLedgerRules rules = BuyerProofEvidenceLedgerRulesLoader.Load(childOptions.RulesPath);
        BuyerProofEvidenceLedgerRunner runner = new();
        BuyerProofEvidenceLedgerReport report = runner.Run(context.RepositoryRoot, childOptions, rules);
        string artifactKey = BuyerProofEvidenceLedgerOutputPaths.ResolveArtifactKey(report);
        BuyerProofEvidenceLedgerOutputResolution outputPaths =
            BuyerProofEvidenceLedgerOutputPaths.Resolve(childOptions, context.RepositoryRoot, artifactKey);
        BuyerProofEvidenceLedgerReport finalReport = report.WithOutputMetadata(
            outputPaths.JsonPath,
            outputPaths.MarkdownPath);

        await PilotReadinessBundleChildArtifactWriter.WriteBuyerProofAsync(
            finalReport,
            outputPaths,
            cancellationToken);

        return BuildSlotResult(
            PilotReadinessBundleSlots.BuyerProofEvidenceLedger,
            "Buyer-proof evidence ledger",
            PilotReadinessBundleVerdictMapper.FromBuyerProof(finalReport.OverallVerdict),
            $"Overall {finalReport.OverallVerdict}; {finalReport.NormalizedSlots.Count} normalized slot(s).",
            finalReport.JsonArtifactPath,
            finalReport.MarkdownArtifactPath);
    }
}
