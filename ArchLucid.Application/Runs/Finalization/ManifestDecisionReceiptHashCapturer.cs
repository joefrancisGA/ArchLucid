using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-15 suggestion 150: bind canonical decision receipt hash into the committed manifest.
/// </summary>
internal static class ManifestDecisionReceiptHashCapturer
{
    public static void ApplyToManifest(
        ManifestDocument manifest,
        Guid runId,
        string manifestVersion,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        FeasibilityVerdict? verdict = manifest.FeasibilityVerdict;

        if (verdict is null || !DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
            return;

        string manifestHashBeforeReceipt = manifestHashService.ComputeHash(manifest);

        DecisionReceiptDocument receipt = DecisionReceiptComposer.BuildForRun(
            runId,
            verdict,
            manifestHashBeforeReceipt,
            manifestVersion);

        manifest.CommittedDecisionReceiptHashSha256 = receipt.ReceiptHashSha256;
    }
}
