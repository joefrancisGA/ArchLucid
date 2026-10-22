using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

public sealed partial class CompareRunsApplicationFacade
{
    /// <inheritdoc />
    public async Task<VersionManifestCompareLoadResult> CompareManifestVersionsAsync(
        string leftVersion,
        string rightVersion,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(leftVersion))
        {
            throw new ArgumentException("leftVersion is required.", nameof(leftVersion));
        }

        if (string.IsNullOrWhiteSpace(rightVersion))
        {
            throw new ArgumentException("rightVersion is required.", nameof(rightVersion));
        }

        string normalizedLeftVersion = leftVersion.Trim();
        string normalizedRightVersion = rightVersion.Trim();
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        GoldenManifest? left = await _unifiedGoldenManifestReader.GetByVersionAsync(normalizedLeftVersion, ct);

        if (left is null)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseManifestNotFound,
                VersionLabel = normalizedLeftVersion,
            };
        }

        (bool leftOk, ManifestCompareLoadOutcome? leftBlocked, Guid? leftRunId) =
            await TryResolveManifestVersionScopeAsync(left, isLeft: true, scope, ct);

        if (!leftOk)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = leftBlocked!.Value,
                RunId = leftRunId,
                VersionLabel = normalizedLeftVersion,
            };
        }

        GoldenManifest? right = await _unifiedGoldenManifestReader.GetByVersionAsync(normalizedRightVersion, ct);

        if (right is null)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetManifestNotFound,
                VersionLabel = normalizedRightVersion,
            };
        }

        (bool rightOk, ManifestCompareLoadOutcome? rightBlocked, Guid? rightRunId) =
            await TryResolveManifestVersionScopeAsync(right, isLeft: false, scope, ct);

        if (!rightOk)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = rightBlocked!.Value,
                RunId = rightRunId,
                VersionLabel = normalizedRightVersion,
            };
        }

        Guid leftRunGuid = leftRunId!.Value;
        Guid rightRunGuid = rightRunId!.Value;

        RunRecord? leftHeader = await _authorityRunRepository.GetByIdAsync(scope, leftRunGuid, ct);
        RunRecord? rightHeader = await _authorityRunRepository.GetByIdAsync(scope, rightRunGuid, ct);

        if (leftHeader is null)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseRunNotFound,
                RunId = leftRunGuid,
            };
        }

        if (rightHeader is null)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetRunNotFound,
                RunId = rightRunGuid,
            };
        }

        try
        {
            RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(leftHeader, rightHeader);
        }
        catch (ConflictException)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.PinFingerprintMismatch,
                RunId = leftRunGuid,
            };
        }

        Task<RunDetailDto?> leftDetailTask =
            _authorityQuery.GetRunDetailForManifestCompareAsync(scope, leftRunGuid, ct);
        Task<RunDetailDto?> rightDetailTask =
            _authorityQuery.GetRunDetailForManifestCompareAsync(scope, rightRunGuid, ct);
        await Task.WhenAll(leftDetailTask, rightDetailTask);

        RunDetailDto? leftDetail = await leftDetailTask;
        RunDetailDto? rightDetail = await rightDetailTask;

        if (leftDetail?.GoldenManifest is null)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseManifestNotFound,
                RunId = leftRunGuid,
                VersionLabel = normalizedLeftVersion,
            };
        }

        if (rightDetail?.GoldenManifest is null)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetManifestNotFound,
                RunId = rightRunGuid,
                VersionLabel = normalizedRightVersion,
            };
        }

        try
        {
            RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    leftDetail.GoldenManifest.CommittedArtifactInventory),
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    rightDetail.GoldenManifest.CommittedArtifactInventory));
        }
        catch (ConflictException)
        {
            return new VersionManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.CommittedArtifactInventoryMismatch,
                RunId = leftRunGuid,
            };
        }

        GoldenManifest projectedLeft =
            await ProjectCompareManifestAsync(leftDetail.GoldenManifest, leftHeader, ct);
        GoldenManifest projectedRight =
            await ProjectCompareManifestAsync(rightDetail.GoldenManifest, rightHeader, ct);

        return new VersionManifestCompareLoadResult
        {
            Outcome = ManifestCompareLoadOutcome.Success,
            Left = ManifestCompareInventoryCheckedDocumentBuilder.ApplyProjectedTopologyToGoldenManifest(
                leftDetail.GoldenManifest,
                projectedLeft),
            Right = ManifestCompareInventoryCheckedDocumentBuilder.ApplyProjectedTopologyToGoldenManifest(
                rightDetail.GoldenManifest,
                projectedRight),
            InputFingerprints = RunComparePinFingerprintGuard.BuildCompareInputFingerprints(
                leftHeader,
                rightHeader,
                leftDetail.GoldenManifest.ManifestHash,
                rightDetail.GoldenManifest.ManifestHash,
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    leftDetail.GoldenManifest.CommittedArtifactInventory),
                CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                    rightDetail.GoldenManifest.CommittedArtifactInventory)),
        };
    }

    private async Task<(bool ok, ManifestCompareLoadOutcome? blockedOutcome, Guid? runId)> TryResolveManifestVersionScopeAsync(
        GoldenManifest manifest,
        bool isLeft,
        ScopeContext scope,
        CancellationToken ct)
    {
        if (!AuthorityRunIdentifier.TryParse(manifest.RunId, out Guid runGuid))
        {
            return (false, isLeft ? ManifestCompareLoadOutcome.BaseRunNotFound : ManifestCompareLoadOutcome.TargetRunNotFound, null);
        }

        RunRecord? run = await _authorityRunRepository.GetByIdAsync(scope, runGuid, ct);

        if (run is null)
        {
            return (
                false,
                isLeft ? ManifestCompareLoadOutcome.BaseRunNotFound : ManifestCompareLoadOutcome.TargetRunNotFound,
                runGuid);
        }

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run);

        if (phase != AuthorityRunLifecyclePhase.Complete)
        {
            return (
                false,
                isLeft ? ManifestCompareLoadOutcome.BaseLifecycleIncomplete : ManifestCompareLoadOutcome.TargetLifecycleIncomplete,
                runGuid);
        }

        return (true, null, runGuid);
    }

    private async Task<GoldenManifest> ProjectCompareManifestAsync(
        ManifestDocument manifest,
        RunRecord runHeader,
        CancellationToken ct)
    {
        string systemName = runHeader.ScopeProjectId == Guid.Empty
            ? "Unknown"
            : runHeader.ScopeProjectId.ToString("D");

        return await _projectionBuilder.BuildAsync(
            manifest,
            new AuthorityCommitProjectionInput { SystemName = systemName },
            ct);
    }

    private static bool TryParseRunId(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
