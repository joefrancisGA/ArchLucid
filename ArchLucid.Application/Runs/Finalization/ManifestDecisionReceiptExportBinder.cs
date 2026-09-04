using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-18 suggestion 171 / wave-19 suggestions 181–182–188: rebuild committed-run decision receipts using the
///     pre-receipt manifest hash and verify they match the sealed
///     <see cref="ManifestDocument.CommittedDecisionReceiptHashSha256" />.
/// </summary>
internal static class ManifestDecisionReceiptExportBinder
{
    public static DecisionReceiptRunBuildOutcome? TryGetSealedReceiptReadinessOutcome(
        ManifestDocument manifest,
        FeasibilityVerdict? verdict,
        string? manifestVersion)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        if (verdict is null
            || string.IsNullOrWhiteSpace(manifestVersion)
            || string.IsNullOrWhiteSpace(manifest.CommittedDecisionReceiptHashSha256))
        {
            return DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete;
        }

        return null;
    }

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

        DecisionReceiptRunBuildOutcome? readinessOutcome =
            TryGetSealedReceiptReadinessOutcome(manifest, verdict, manifestVersion);

        if (readinessOutcome == DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete)
        {
            return new DecisionReceiptRunBuildResult
            {
                Outcome = DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete,
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

    /// <summary>Wave-21 suggestion 201 / reused by review-board export: fail-closed when sealed receipt fields are incomplete or mismatched.</summary>
    public static async Task EnsureSealedExportReceiptVerifiedOrThrowAsync(
        Guid runId,
        string runIdLabel,
        IAuthorityQueryService authorityQuery,
        IManifestHashService manifestHashService,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentNullException.ThrowIfNull(authorityQuery);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(scope);

        RunDetailDto? compareDetail =
            await authorityQuery.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        if (compareDetail?.GoldenManifest is null)
            throw new ConflictException($"Export blocked for run '{runIdLabel}': committed golden manifest is missing.");

        DecisionReceiptRunBuildOutcome? readinessOutcome =
            TryGetSealedReceiptReadinessOutcome(
                compareDetail.GoldenManifest,
                compareDetail.GoldenManifest.FeasibilityVerdict,
                compareDetail.GoldenManifest.Metadata?.Version);

        if (readinessOutcome == DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete)
        {
            throw new ConflictException(
                $"Export blocked for run '{runIdLabel}': sealed decision receipt fields are incomplete.");
        }

        if (readinessOutcome is not null)
            return;

        DecisionReceiptRunBuildResult buildResult = BuildVerifiedExportReceipt(
            runId,
            compareDetail.GoldenManifest,
            compareDetail.GoldenManifest.FeasibilityVerdict!,
            compareDetail.GoldenManifest.Metadata!.Version!.Trim(),
            manifestHashService);

        if (buildResult.Outcome == DecisionReceiptRunBuildOutcome.SealedHashMismatch)
        {
            throw new ConflictException(
                $"Export blocked for run '{runIdLabel}': sealed decision receipt hash verification failed.");
        }

        if (buildResult.Outcome != DecisionReceiptRunBuildOutcome.Success)
        {
            throw new ConflictException(
                $"Export blocked for run '{runIdLabel}': sealed decision receipt could not be verified.");
        }
    }
}
