using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunDetailPageBundleController
{
    /// <summary>Deferred workspace context: recent project runs and prior-committed compare when applicable.</summary>
    [HttpGet("workspace-context-bundle")]
    [ProducesResponseType(typeof(RunDetailWorkspaceContextBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkspaceContextBundle(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        RunSummaryDto? currentRun =
            await _queryService.GetRunSummaryAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (currentRun is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        IReadOnlyList<RunSummaryDto> projectRuns = await _queryService
            .ListRunsByProjectAsync(scope, currentRun.ProjectId, DeferredProjectRunTake, cancellationToken)
            .ConfigureAwait(false);

        RunSummaryDto? priorCommittedRun = await _queryService
            .GetPriorCommittedRunSummaryBeforeCurrentAsync(
                scope,
                runId,
                currentRun.ProjectId,
                currentRun.CreatedUtc,
                cancellationToken)
            .ConfigureAwait(false);

        RunComparisonResponse? priorComparison = null;
        string? priorComparisonBlockedReason = null;

        if (priorCommittedRun is not null)
        {
            ScopedRunPairLoadResult loadResult = await _compareRunsFacade
                .LoadScopedRunPairAsync(
                    priorCommittedRun.RunId.ToString("N"),
                    runId.ToString("N"),
                    cancellationToken)
                .ConfigureAwait(false);

            priorComparisonBlockedReason = MapPriorCompareBlockedReason(loadResult);

            if (priorComparisonBlockedReason is null && loadResult.Outcome == ScopedRunPairLoadOutcome.Success)
            {
                RunComparisonResult? comparison = await _compareService
                    .CompareRunsAsync(scope, priorCommittedRun.RunId, runId, cancellationToken)
                    .ConfigureAwait(false);

                if (comparison is not null)
                {
                    priorComparison = MapRunComparison(comparison);
                }
            }
        }

        RunDetailWorkspaceContextBundleResponse body = new()
        {
            RecentProjectRuns = projectRuns.Select(ToRunSummaryResponse).ToList(),
            PriorCommittedRunComparison = priorComparison,
            PriorCommittedRunId = priorCommittedRun?.RunId,
            PriorCommittedRunCreatedUtc = priorCommittedRun?.CreatedUtc,
            PriorCommittedRunComparisonBlockedReason = priorComparisonBlockedReason,
        };

        return Ok(body);
    }

    private static string? MapPriorCompareBlockedReason(ScopedRunPairLoadResult loadResult) =>
        loadResult.Outcome switch
        {
            ScopedRunPairLoadOutcome.Success => null,
            ScopedRunPairLoadOutcome.LeftRunNotFound => null,
            ScopedRunPairLoadOutcome.RightRunNotFound => null,
            ScopedRunPairLoadOutcome.LeftManifestNotFound => null,
            ScopedRunPairLoadOutcome.RightManifestNotFound => null,
            ScopedRunPairLoadOutcome.PinFingerprintMismatch =>
                "Compare blocked: create-time pin fingerprints differ between the selected runs.",
            ScopedRunPairLoadOutcome.CommittedArtifactInventoryMismatch =>
                "Compare blocked: committed artifact inventory fingerprints differ between the selected runs.",
            ScopedRunPairLoadOutcome.SealedManifestHashMismatch =>
                "Compare blocked: sealed manifest hash verification failed for one or both selected runs.",
            ScopedRunPairLoadOutcome.LeftLifecycleIncomplete =>
                $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
            ScopedRunPairLoadOutcome.RightLifecycleIncomplete =>
                $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
            _ => throw new InvalidOperationException($"Unexpected run-pair load outcome: {loadResult.Outcome}."),
        };

    private static RunComparisonResponse MapRunComparison(RunComparisonResult result)
    {
        return new RunComparisonResponse
        {
            LeftRunId = result.LeftRunId,
            RightRunId = result.RightRunId,
            RunLevelDiffs = result.RunLevelDiffs.Select(MapDiff).ToList(),
            ManifestComparison = result.ManifestComparison is null
                ? null
                : MapManifestComparison(result.ManifestComparison),
            RunLevelDiffCount = result.RunLevelDiffs.Count,
            HasManifestComparison = result.ManifestComparison is not null,
        };
    }

    private static ManifestComparisonResponse MapManifestComparison(ManifestComparisonResult result)
    {
        return new ManifestComparisonResponse
        {
            LeftManifestId = result.LeftManifestId,
            RightManifestId = result.RightManifestId,
            LeftManifestHash = result.LeftManifestHash,
            RightManifestHash = result.RightManifestHash,
            AddedCount = result.AddedCount,
            RemovedCount = result.RemovedCount,
            ChangedCount = result.ChangedCount,
            Diffs = result.Diffs.Select(MapDiff).ToList(),
            DiffCount = result.Diffs.Count,
        };
    }

    private static DiffItemResponse MapDiff(DiffItem item)
    {
        return new DiffItemResponse
        {
            Section = item.Section,
            Key = item.Key,
            DiffKind = item.DiffKind,
            BeforeValue = item.BeforeValue,
            AfterValue = item.AfterValue,
            Notes = item.Notes,
        };
    }

    private static RunSummaryResponse ToRunSummaryResponse(RunSummaryDto summary)
    {
        return new RunSummaryResponse
        {
            RunId = summary.RunId,
            ProjectId = summary.ProjectId,
            Description = summary.Description,
            DisplayName = string.IsNullOrWhiteSpace(summary.Description) ? null : summary.Description.Trim(),
            IsDemoWelcomeRun = summary.IsDemoWelcomeRun,
            IsSample = summary.IsSample,
            IsPinned = summary.IsPinned,
            CreatedUtc = summary.CreatedUtc,
            CreatedByUserId = summary.CreatedByUserId,
            HasContextSnapshot = summary.HasContextSnapshot,
            HasGraphSnapshot = summary.HasGraphSnapshot,
            HasFindingsSnapshot = summary.HasFindingsSnapshot,
            HasGoldenManifest = summary.HasGoldenManifest,
            GoldenManifestId = summary.GoldenManifestId,
            HasDecisionTrace = summary.HasDecisionTrace,
            HasArtifactBundle = summary.HasArtifactBundle,
            HasWarnings = summary.HasWarnings,
            HasGovernanceWarnings = summary.HasGovernanceWarnings,
            RunDegradedExecution = summary.RunDegradedExecution,
            DegradedExecutionAgents = summary.DegradedExecutionAgents,
            PackageOrigin = summary.PackageOrigin,
            StructuralExecutionMode = summary.StructuralExecutionMode,
            AuthorityLifecyclePhase = summary.AuthorityLifecyclePhase,
        };
    }

    private static ManifestSummaryResponse ToManifestSummaryResponse(ManifestSummaryDto summary)
    {
        return new ManifestSummaryResponse
        {
            ManifestId = summary.ManifestId,
            RunId = summary.RunId,
            CreatedUtc = summary.CreatedUtc,
            ManifestHash = summary.ManifestHash,
            RuleSetId = summary.RuleSetId,
            RuleSetVersion = summary.RuleSetVersion,
            DecisionCount = summary.DecisionCount,
            WarningCount = summary.WarningCount,
            UnresolvedIssueCount = summary.UnresolvedIssueCount,
            Status = summary.Status,
            HasWarnings = summary.WarningCount > 0,
            HasUnresolvedIssues = summary.UnresolvedIssueCount > 0,
            OperatorSummary =
                $"{summary.DecisionCount} decisions, {summary.WarningCount} warnings, {summary.UnresolvedIssueCount} unresolved issues, status {summary.Status}",
            TopDecisionSynopses = summary.TopDecisionSynopses,
            FeasibilityVerdict = summary.FeasibilityVerdict,
            EffectiveGovernanceAtCommit = summary.EffectiveGovernanceAtCommit,
            ReviewStandardsAtCommit = summary.ReviewStandardsAtCommit,
        };
    }
}
