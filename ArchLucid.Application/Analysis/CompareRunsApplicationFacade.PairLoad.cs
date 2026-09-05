using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

public sealed partial class CompareRunsApplicationFacade
{
    /// <inheritdoc />
    public async Task<ScopedRunPairLoadResult> LoadScopedRunPairAsync(
        string leftRunId,
        string rightRunId,
        CancellationToken ct)
    {
        Task<ArchitectureRunDetail?> leftDetailTask =
            _runDetailQueryService.GetRunDetailForRollupAsync(leftRunId, ct);
        Task<ArchitectureRunDetail?> rightDetailTask =
            _runDetailQueryService.GetRunDetailForRollupAsync(rightRunId, ct);
        await Task.WhenAll(leftDetailTask, rightDetailTask);

        ArchitectureRunDetail? left = await leftDetailTask;
        if (left is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.LeftRunNotFound,
                MissingRunId = leftRunId,
            };
        }

        ArchitectureRunDetail? right = await rightDetailTask;
        if (right is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightRunNotFound,
                MissingRunId = rightRunId,
            };
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!TryParseRunId(leftRunId, out Guid leftGuid))
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.LeftRunNotFound,
                MissingRunId = leftRunId,
            };
        }

        if (!TryParseRunId(rightRunId, out Guid rightGuid))
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightRunNotFound,
                MissingRunId = rightRunId,
            };
        }

        RunRecord? leftHeader = await _authorityRunRepository.GetByIdAsync(scope, leftGuid, ct);
        RunRecord? rightHeader = await _authorityRunRepository.GetByIdAsync(scope, rightGuid, ct);

        if (leftHeader is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.LeftRunNotFound,
                MissingRunId = leftRunId,
            };
        }

        if (rightHeader is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightRunNotFound,
                MissingRunId = rightRunId,
            };
        }

        try
        {
            RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(leftHeader, rightHeader);
        }
        catch (ConflictException)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.PinFingerprintMismatch,
                RunId = leftGuid,
            };
        }

        Task<RunDetailDto?> leftCompareTask =
            _authorityQuery.GetRunDetailForManifestCompareAsync(scope, leftGuid, ct);
        Task<RunDetailDto?> rightCompareTask =
            _authorityQuery.GetRunDetailForManifestCompareAsync(scope, rightGuid, ct);
        await Task.WhenAll(leftCompareTask, rightCompareTask);

        RunDetailDto? leftCompare = await leftCompareTask;
        RunDetailDto? rightCompare = await rightCompareTask;

        if (leftCompare?.GoldenManifest is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.LeftManifestNotFound,
                MissingRunId = leftRunId,
            };
        }

        if (rightCompare?.GoldenManifest is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightManifestNotFound,
                MissingRunId = rightRunId,
            };
        }

        try
        {
            await CompareRunsSealedManifestHashGuard.EnsureRunPairSealedManifestHashesOrThrowAsync(
                leftGuid,
                rightGuid,
                scope,
                _authorityQuery,
                _manifestHashService,
                ct);
        }
        catch (ConflictException)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.SealedManifestHashMismatch,
                RunId = leftGuid,
            };
        }

        try
        {
            RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    leftCompare.GoldenManifest.CommittedArtifactInventory),
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    rightCompare.GoldenManifest.CommittedArtifactInventory));
        }
        catch (ConflictException)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.CommittedArtifactInventoryMismatch,
                RunId = leftGuid,
            };
        }

        return new ScopedRunPairLoadResult
        {
            Outcome = ScopedRunPairLoadOutcome.Success,
            Left = left,
            Right = right,
            InputFingerprints = RunComparePinFingerprintGuard.BuildCompareInputFingerprints(
                leftHeader,
                rightHeader,
                leftCompare.GoldenManifest.ManifestHash,
                rightCompare.GoldenManifest.ManifestHash,
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    leftCompare.GoldenManifest.CommittedArtifactInventory),
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    rightCompare.GoldenManifest.CommittedArtifactInventory)),
        };
    }
}
