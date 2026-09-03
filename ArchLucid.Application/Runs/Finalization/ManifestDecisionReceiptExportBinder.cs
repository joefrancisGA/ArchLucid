using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-18 suggestion 171 / wave-19 suggestions 181–182–188: rebuild committed-run decision receipts using the
///     pre-receipt manifest hash and verify they match the sealed
///     <see cref="ManifestDocument.CommittedDecisionReceiptHashSha256" />.
/// </summary>
internal static class ManifestDecisionReceiptExportBinder
{
    public static DecisionReceiptRunBuildResult BuildVerifiedExportReceipt(
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
        {
            return new DecisionReceiptRunBuildResult
            {
                Outcome = DecisionReceiptRunBuildOutcome.NotFound,
            };
        }

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
            return new DecisionReceiptRunBuildResult
            {
                Outcome = DecisionReceiptRunBuildOutcome.SealedHashMismatch,
            };
        }

        return new DecisionReceiptRunBuildResult
        {
            Outcome = DecisionReceiptRunBuildOutcome.Success,
            Receipt = receipt,
        };
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

        DecisionReceiptRunBuildResult buildResult = BuildVerifiedExportReceipt(
            runId,
            manifest,
            verdict,
            manifestVersion,
            manifestHashService);

        if (buildResult.Outcome == DecisionReceiptRunBuildOutcome.SealedHashMismatch)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': sealed decision receipt hash does not match recomputed receipt.");
        }

        if (buildResult.Outcome != DecisionReceiptRunBuildOutcome.Success)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': sealed decision receipt hash could not be verified.");
        }
    }

    /// <summary>Wave-19 suggestion 188: verify sealed manifest hash without mutating receipt fields on the live document.</summary>
    public static void EnsureSealedManifestHashMatchesOrThrow(
        ManifestDocument manifest,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (string.IsNullOrWhiteSpace(manifest.ManifestHash))
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': sealed manifest hash is missing.");
        }

        string recomputedHash = manifestHashService.ComputeHash(manifest);

        if (!string.Equals(recomputedHash, manifest.ManifestHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': sealed manifest hash does not match recomputed hash.");
        }
    }

    public static string ComputeHashBeforeReceipt(ManifestDocument manifest, IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        ManifestDocument scratch = ManifestDocumentHashScratch.WithCommittedDecisionReceiptHashCleared(manifest);
        return manifestHashService.ComputeHash(scratch);
    }
}
