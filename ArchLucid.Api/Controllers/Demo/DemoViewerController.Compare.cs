using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Persistence.Coordination.Compare;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Demo;

public sealed partial class DemoViewerController
{
    /// <summary>
    ///     Compares two runs; defaults to Contoso baseline vs hardened GUIDs when query params omitted (single-catalog
    ///     seed).
    /// </summary>
    [HttpGet("compare")]
    [ProducesResponseType(typeof(RunComparisonResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CompareRuns(
        [FromQuery] Guid? leftRunId,
        [FromQuery] Guid? rightRunId,
        CancellationToken cancellationToken = default)
    {
        if (!IsViewerAllowed())
            return Unauthorized();

        Guid left = leftRunId ?? ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        Guid right = rightRunId ?? ContosoRetailDemoIdentifiers.AuthorityRunHardenedId;

        using IDisposable _ = AmbientScopeContext.Push(DemoScopes.BuildDemoScope());

        ScopeContext scope = DemoScopes.BuildDemoScope();
        ScopedRunPairLoadResult loadResult = await compareRunsFacade.LoadScopedRunPairAsync(
            left.ToString("N"),
            right.ToString("N"),
            cancellationToken);

        IActionResult? loadError = MapScopedRunPairLoadOutcome(loadResult);

        if (loadError is not null)
            return loadError;

        RunComparisonResult? result =
            await authorityCompareService.CompareRunsAsync(scope, left, right, cancellationToken);

        if (result is null)
            return this.NotFoundProblem(
                $"One or both runs ('{left}', '{right}') were not found in the demo scope.",
                ProblemTypes.RunNotFound);

        return Ok(
            new RunComparisonResponse
            {
                LeftRunId = result.LeftRunId,
                RightRunId = result.RightRunId,
                RunLevelDiffs = result.RunLevelDiffs.Select(MapDiffItem).ToList(),
                ManifestComparison =
                    result.ManifestComparison is null ? null : MapManifestResponse(result.ManifestComparison),
                RunLevelDiffCount = result.RunLevelDiffs.Count,
                HasManifestComparison = result.ManifestComparison is not null
            });
    }

    /// <summary>POST is not supported on the anonymous viewer.</summary>
    /// <remarks>
    ///     <c>[AcceptVerbs("POST")]</c> keeps POST routing; CI treats <c>[HttpPost]</c> as mutating and would require
    ///     audit for this non-mutating 405 handler.
    /// </remarks>
    [AcceptVerbs("POST")]
    [Route("{*catchAll}")]
    [ProducesResponseType(StatusCodes.Status405MethodNotAllowed)]
    public IActionResult PostNotAllowed()
    {
        return StatusCode(StatusCodes.Status405MethodNotAllowed);
    }

    private IActionResult? MapScopedRunPairLoadOutcome(ScopedRunPairLoadResult loadResult) =>
        loadResult.Outcome switch
        {
            ScopedRunPairLoadOutcome.Success => null,
            ScopedRunPairLoadOutcome.LeftRunNotFound => this.NotFoundProblem(
                $"Run '{loadResult.MissingRunId}' was not found.",
                ProblemTypes.RunNotFound),
            ScopedRunPairLoadOutcome.RightRunNotFound => this.NotFoundProblem(
                $"Run '{loadResult.MissingRunId}' was not found.",
                ProblemTypes.RunNotFound),
            ScopedRunPairLoadOutcome.LeftManifestNotFound => this.NotFoundProblem(
                $"Manifest for run '{loadResult.MissingRunId}' was not found.",
                ProblemTypes.ManifestNotFound),
            ScopedRunPairLoadOutcome.RightManifestNotFound => this.NotFoundProblem(
                $"Manifest for run '{loadResult.MissingRunId}' was not found.",
                ProblemTypes.ManifestNotFound),
            ScopedRunPairLoadOutcome.PinFingerprintMismatch => this.ConflictProblem(
                "Compare blocked: create-time pin fingerprints differ between the selected runs.",
                ProblemTypes.Conflict),
            ScopedRunPairLoadOutcome.CommittedArtifactInventoryMismatch => this.ConflictProblem(
                "Compare blocked: committed artifact inventory fingerprints differ between the selected runs.",
                ProblemTypes.CommittedArtifactInventoryMismatch),
            ScopedRunPairLoadOutcome.SealedManifestHashMismatch => this.ConflictProblem(
                "Compare blocked: sealed manifest hash verification failed for one or both selected runs.",
                ProblemTypes.Conflict),
            ScopedRunPairLoadOutcome.LeftLifecycleIncomplete => this.ConflictProblem(
                $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ScopedRunPairLoadOutcome.RightLifecycleIncomplete => this.ConflictProblem(
                $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected run-pair load outcome: {loadResult.Outcome}."),
        };

    private bool IsViewerAllowed()
    {
        return demoOptions.Value.AnonymousViewer.Enabled;
    }

    private static DiffItemResponse MapDiffItem(DiffItem item)
    {
        return new DiffItemResponse
        {
            Section = item.Section,
            Key = item.Key,
            DiffKind = item.DiffKind,
            BeforeValue = item.BeforeValue,
            AfterValue = item.AfterValue,
            Notes = item.Notes
        };
    }

    private static ManifestComparisonResponse MapManifestResponse(ManifestComparisonResult result)
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
            Diffs = result.Diffs.Select(MapDiffItem).ToList(),
            DiffCount = result.Diffs.Count
        };
    }
}
