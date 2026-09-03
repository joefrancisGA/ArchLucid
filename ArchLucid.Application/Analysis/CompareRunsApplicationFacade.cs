using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Default <see cref="ICompareRunsApplicationFacade"/> consolidating comparison route orchestration previously in
///     <c>ComparisonController</c> and <c>RunComparisonController</c>.
/// </summary>
public sealed class CompareRunsApplicationFacade(
    IAuthorityQueryService authorityQuery,
    IRunDetailQueryService runDetailQueryService,
    IRunRepository authorityRunRepository,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IComparisonService comparison,
    IAgentResultDiffService agentResultDiffService,
    IScopeContextProvider scopeProvider) : ICompareRunsApplicationFacade
{
    private readonly IAuthorityQueryService _authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IRunRepository _authorityRunRepository =
        authorityRunRepository ?? throw new ArgumentNullException(nameof(authorityRunRepository));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IComparisonService _comparison =
        comparison ?? throw new ArgumentNullException(nameof(comparison));

    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

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

        return new ScopedRunPairLoadResult
        {
            Outcome = ScopedRunPairLoadOutcome.Success,
            Left = left,
            Right = right,
        };
    }

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

        ComparisonResult comparison = _comparison.Compare(baseRun.GoldenManifest, targetRun.GoldenManifest);
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

        return new VersionManifestCompareLoadResult
        {
            Outcome = ManifestCompareLoadOutcome.Success,
            Left = left,
            Right = right,
        };
    }

    /// <inheritdoc />
    public AgentResultDiffResult CompareAgentResults(
        string leftRunId,
        ArchitectureRunDetail leftDetail,
        string rightRunId,
        ArchitectureRunDetail rightDetail) =>
        _agentResultDiffService.Compare(
            leftRunId,
            leftDetail.Results,
            rightRunId,
            rightDetail.Results);

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
}
