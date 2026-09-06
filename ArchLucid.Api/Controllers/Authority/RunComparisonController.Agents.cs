using ArchLucid.Api.Http;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Comparison;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunComparisonController
{
    [HttpGet("review/compare/agents")]
    [ProducesResponseType(typeof(AgentResultCompareResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareAgentResults(
        [FromQuery] RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, AgentResultDiffResult? diff) =
            await CompareAgentResultsCoreAsync(query, cancellationToken);
        return error ?? Ok(ComparisonResponseMapper.ToAgentResultCompareResponse(diff!));
    }

    [HttpGet("review/compare/agents/summary")]
    [ProducesResponseType(typeof(AgentResultCompareSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareAgentResultsSummary(
        [FromQuery] RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, AgentResultDiffResult? diff) =
            await CompareAgentResultsCoreAsync(query, cancellationToken);
        if (error is not null)
            return error;

        string summary = _agentResultDiffSummaryFormatter.FormatMarkdown(diff!);
        return Ok(ComparisonResponseMapper.ToAgentResultCompareSummaryResponse(summary, diff!));
    }

    private async Task<(IActionResult? Error, AgentResultDiffResult? Diff)> CompareAgentResultsCoreAsync(
        RunPairQuery query,
        CancellationToken cancellationToken)
    {
        (IActionResult? error, ArchitectureRunDetail? leftDetail, ArchitectureRunDetail? rightDetail, CompareInputFingerprints? inputFingerprints) =
            await LoadValidatedRunPairAsync(query, cancellationToken);
        if (error is not null)
            return (error, null);

        AgentResultDiffResult diff = _compareRunsFacade.CompareAgentResults(
            query.LeftRunId,
            leftDetail!,
            query.RightRunId,
            rightDetail!,
            inputFingerprints);
        return (null, diff);
    }

    /// <summary>
    ///     Validates the query, loads both runs through <see cref="ICompareRunsApplicationFacade" />, and returns 404 when
    ///     either run is missing.
    /// </summary>
    private async Task<(IActionResult? Error, ArchitectureRunDetail? Left, ArchitectureRunDetail? Right, CompareInputFingerprints? InputFingerprints)>
        LoadValidatedRunPairAsync(
            RunPairQuery query,
            CancellationToken cancellationToken)
    {
        IActionResult? queryError = await ValidateRunPairQueryAsync(query, cancellationToken);
        if (queryError is not null)
            return (queryError, null, null, null);

        ScopedRunPairLoadResult loadResult = await _compareRunsFacade.LoadScopedRunPairAsync(
            query.LeftRunId,
            query.RightRunId,
            cancellationToken);

        return loadResult.Outcome switch
        {
            ScopedRunPairLoadOutcome.Success => (
                null,
                loadResult.Left!,
                loadResult.Right!,
                loadResult.InputFingerprints),
            ScopedRunPairLoadOutcome.LeftRunNotFound => (
                this.NotFoundProblem($"Run '{loadResult.MissingRunId}' was not found.", ProblemTypes.RunNotFound),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.RightRunNotFound => (
                this.NotFoundProblem($"Run '{loadResult.MissingRunId}' was not found.", ProblemTypes.RunNotFound),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.LeftManifestNotFound => (
                this.NotFoundProblem(
                    $"Manifest for run '{loadResult.MissingRunId}' was not found.",
                    ProblemTypes.ManifestNotFound),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.RightManifestNotFound => (
                this.NotFoundProblem(
                    $"Manifest for run '{loadResult.MissingRunId}' was not found.",
                    ProblemTypes.ManifestNotFound),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.PinFingerprintMismatch => (
                this.ConflictProblem(
                    "Compare blocked: create-time pin fingerprints differ between the selected runs.",
                    ProblemTypes.Conflict),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.CommittedArtifactInventoryMismatch => (
                this.ConflictProblem(
                    "Compare blocked: committed artifact inventory fingerprints differ between the selected runs.",
                    ProblemTypes.CommittedArtifactInventoryMismatch),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.SealedManifestHashMismatch => (
                this.ConflictProblem(
                    "Compare blocked: sealed manifest hash verification failed for one or both selected runs.",
                    ProblemTypes.Conflict),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.LeftLifecycleIncomplete => (
                this.ConflictProblem(
                    $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
                    ProblemTypes.Conflict),
                null,
                null,
                null),
            ScopedRunPairLoadOutcome.RightLifecycleIncomplete => (
                this.ConflictProblem(
                    $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
                    ProblemTypes.Conflict),
                null,
                null,
                null),
            _ => throw new InvalidOperationException($"Unexpected run-pair load outcome: {loadResult.Outcome}."),
        };
    }
}
