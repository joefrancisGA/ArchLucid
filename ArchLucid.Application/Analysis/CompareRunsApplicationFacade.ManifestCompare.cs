using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

public sealed partial class CompareRunsApplicationFacade
{
    /// <inheritdoc />
    public async Task<ManifestCompareLoadResult> CompareManifestsAsync(
        Guid baseRunId,
        Guid targetRunId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        Task<RunDetailDto?> baseRunTask = _authorityQuery.GetRunDetailForManifestCompareAsync(scope, baseRunId, ct);
        Task<RunDetailDto?> targetRunTask = _authorityQuery.GetRunDetailForManifestCompareAsync(scope, targetRunId, ct);
        await Task.WhenAll(baseRunTask, targetRunTask);

        RunDetailDto? baseRun = await baseRunTask;
        if (baseRun is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseRunNotFound,
                RunId = baseRunId,
            };
        }

        RunDetailDto? targetRun = await targetRunTask;
        if (targetRun is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetRunNotFound,
                RunId = targetRunId,
            };
        }

        if (baseRun.GoldenManifest is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseManifestNotFound,
                RunId = baseRunId,
            };
        }

        if (targetRun.GoldenManifest is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetManifestNotFound,
                RunId = targetRunId,
            };
        }

        ArchitectureRunDetail? baseDetail = await _runDetailQueryService
            .GetRunDetailAsync(baseRunId.ToString("N"), ct);

        if (baseDetail is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseRunNotFound,
                RunId = baseRunId,
            };
        }

        ArchitectureRunDetail? targetDetail = await _runDetailQueryService
            .GetRunDetailAsync(targetRunId.ToString("N"), ct);

        if (targetDetail is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetRunNotFound,
                RunId = targetRunId,
            };
        }

        if (!TryEnsureComplete(baseDetail, baseRunId, ManifestCompareLoadOutcome.BaseLifecycleIncomplete, out ManifestCompareLoadOutcome? baseLifecycleOutcome))
        {
            return new ManifestCompareLoadResult
            {
                Outcome = baseLifecycleOutcome!.Value,
                RunId = baseRunId,
            };
        }

        if (!TryEnsureComplete(targetDetail, targetRunId, ManifestCompareLoadOutcome.TargetLifecycleIncomplete, out ManifestCompareLoadOutcome? targetLifecycleOutcome))
        {
            return new ManifestCompareLoadResult
            {
                Outcome = targetLifecycleOutcome!.Value,
                RunId = targetRunId,
            };
        }

        RunRecord? baseHeader = await _authorityRunRepository.GetByIdAsync(scope, baseRunId, ct);
        RunRecord? targetHeader = await _authorityRunRepository.GetByIdAsync(scope, targetRunId, ct);

        if (baseHeader is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseRunNotFound,
                RunId = baseRunId,
            };
        }

        if (targetHeader is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetRunNotFound,
                RunId = targetRunId,
            };
        }

        try
        {
            RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(baseHeader, targetHeader);
        }
        catch (ConflictException)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.PinFingerprintMismatch,
                RunId = baseRunId,
            };
        }

        try
        {
            RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    baseRun.GoldenManifest.CommittedArtifactInventory),
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    targetRun.GoldenManifest.CommittedArtifactInventory));
        }
        catch (ConflictException)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.CommittedArtifactInventoryMismatch,
                RunId = baseRunId,
            };
        }

        ComparisonResult comparison = _comparison.Compare(
            ManifestCompareInventoryCheckedDocumentBuilder.ApplyProjectedTopology(
                baseRun.GoldenManifest,
                await ProjectCompareManifestAsync(baseRun.GoldenManifest, baseHeader, ct)),
            ManifestCompareInventoryCheckedDocumentBuilder.ApplyProjectedTopology(
                targetRun.GoldenManifest,
                await ProjectCompareManifestAsync(targetRun.GoldenManifest, targetHeader, ct)));
        comparison.InputFingerprints = RunComparePinFingerprintGuard.BuildCompareInputFingerprints(
            baseHeader,
            targetHeader,
            baseRun.GoldenManifest.ManifestHash,
            targetRun.GoldenManifest.ManifestHash,
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(baseRun.GoldenManifest.CommittedArtifactInventory),
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(targetRun.GoldenManifest.CommittedArtifactInventory));

        return new ManifestCompareLoadResult
        {
            Outcome = ManifestCompareLoadOutcome.Success,
            Comparison = comparison,
        };
    }

    private static bool TryEnsureComplete(
        ArchitectureRunDetail detail,
        Guid runId,
        ManifestCompareLoadOutcome blockedOutcome,
        out ManifestCompareLoadOutcome? outcome)
    {
        outcome = null;

        try
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId.ToString("N"));
            return true;
        }
        catch (ConflictException)
        {
            outcome = blockedOutcome;
            return false;
        }
    }
}
