using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-18 suggestion 171: rebuild committed-run decision receipts using the pre-receipt manifest hash
///     and verify they match the sealed <see cref="ManifestDocument.CommittedDecisionReceiptHashSha256" />.
/// </summary>
internal static class ManifestDecisionReceiptExportBinder
{
    public static DecisionReceiptDocument? TryBuildVerifiedExportReceiptOrNull(
        Guid runId,
        ManifestDocument manifest,
        FeasibilityVerdict verdict,
        string manifestVersion,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(verdict);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (string.IsNullOrWhiteSpace(manifest.CommittedDecisionReceiptHashSha256))
            return null;

        string manifestHashBeforeReceipt = ComputeHashBeforeReceipt(manifest, manifestHashService);

        DecisionReceiptDocument receipt = DecisionReceiptComposer.BuildForRun(
            runId,
            verdict,
            manifestHashBeforeReceipt,
            manifestVersion);

        if (!string.Equals(
                receipt.ReceiptHashSha256,
                manifest.CommittedDecisionReceiptHashSha256,
                StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return receipt;
    }

    public static void EnsureSealedReceiptHashMatchesOrThrow(
        Guid runId,
        ManifestDocument manifest,
        string manifestVersion,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (string.IsNullOrWhiteSpace(manifest.CommittedDecisionReceiptHashSha256))
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': sealed decision receipt hash is missing.");
        }

        FeasibilityVerdict? verdict = manifest.FeasibilityVerdict;

        if (verdict is null)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': feasibility verdict is required to verify sealed decision receipt hash.");
        }

        DecisionReceiptDocument? receipt = TryBuildVerifiedExportReceiptOrNull(
            runId,
            manifest,
            verdict,
            manifestVersion,
            manifestHashService);

        if (receipt is null)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': sealed decision receipt hash does not match recomputed receipt.");
        }
    }

    public static string ComputeHashBeforeReceipt(ManifestDocument manifest, IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string? savedReceiptHash = manifest.CommittedDecisionReceiptHashSha256;
        manifest.CommittedDecisionReceiptHashSha256 = null;

        try
        {
            return manifestHashService.ComputeHash(manifest);
        }
        finally
        {
            manifest.CommittedDecisionReceiptHashSha256 = savedReceiptHash;
        }
    }
}
