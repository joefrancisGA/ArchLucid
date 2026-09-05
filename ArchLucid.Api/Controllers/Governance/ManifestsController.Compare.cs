using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    [HttpGet("manifest/compare")]
    [ProducesResponseType(typeof(ManifestCompareResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompareManifests(
        [FromQuery] string leftVersion,
        [FromQuery] string rightVersion,
        CancellationToken cancellationToken)
    {
        LoadedManifestPair loaded = await LoadAndCompareManifestPairAsync(leftVersion, rightVersion, cancellationToken);

        if (loaded.Error is not null)
            return loaded.Error;

        return Ok(new ManifestCompareResponse
        {
            LeftManifest = loaded.Left!, RightManifest = loaded.Right!, Diff = loaded.Diff!
        });
    }

    [HttpGet("manifest/compare/summary")]
    [ProducesResponseType(typeof(ManifestCompareSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompareManifestsSummary(
        [FromQuery] string leftVersion,
        [FromQuery] string rightVersion,
        CancellationToken cancellationToken)
    {
        LoadedManifestPair loaded = await LoadAndCompareManifestPairAsync(leftVersion, rightVersion, cancellationToken);

        if (loaded.Error is not null)
            return loaded.Error;

        string summary = manifestDiffSummaryFormatter.FormatMarkdown(loaded.Diff!);

        return Ok(new ManifestCompareSummaryResponse
        {
            LeftManifestVersion = loaded.Diff!.LeftManifestVersion,
            RightManifestVersion = loaded.Diff!.RightManifestVersion,
            Format = FormatMarkdown,
            Summary = summary,
            Diff = loaded.Diff!
        });
    }

    [HttpGet("manifest/compare/export")]
    [ProducesResponseType(typeof(ManifestCompareExportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompareManifestsExport(
        [FromQuery] string leftVersion,
        [FromQuery] string rightVersion,
        CancellationToken cancellationToken)
    {
        LoadedManifestPair loaded = await LoadAndCompareManifestPairAsync(leftVersion, rightVersion, cancellationToken);

        if (loaded.Error is not null)
            return loaded.Error;

        string summary = manifestDiffSummaryFormatter.FormatMarkdown(loaded.Diff!);
        string content =
            manifestDiffExportService.GenerateMarkdownExport(loaded.Left!, loaded.Right!, loaded.Diff!, summary);

        string normalizedLeftVersion = loaded.Diff!.LeftManifestVersion;
        string normalizedRightVersion = loaded.Diff!.RightManifestVersion;

        return Ok(new ManifestCompareExportResponse
        {
            LeftManifestVersion = normalizedLeftVersion,
            RightManifestVersion = normalizedRightVersion,
            Format = FormatMarkdown,
            FileName = $"compare_{normalizedLeftVersion}_to_{normalizedRightVersion}.md",
            Content = content
        });
    }

    [HttpGet("manifest/compare/export/file")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadCompareManifestsExport(
        [FromQuery] string leftVersion,
        [FromQuery] string rightVersion,
        CancellationToken cancellationToken)
    {
        LoadedManifestPair loaded = await LoadAndCompareManifestPairAsync(leftVersion, rightVersion, cancellationToken);

        if (loaded.Error is not null)
            return loaded.Error;

        string summary = manifestDiffSummaryFormatter.FormatMarkdown(loaded.Diff!);
        string content =
            manifestDiffExportService.GenerateMarkdownExport(loaded.Left!, loaded.Right!, loaded.Diff!, summary);

        string normalizedLeftVersion = loaded.Diff!.LeftManifestVersion;
        string normalizedRightVersion = loaded.Diff!.RightManifestVersion;
        string fileName = $"compare_{normalizedLeftVersion}_to_{normalizedRightVersion}.md";
        return ApiFileResults.RangeText(Request, content, "text/markdown", fileName);
    }

    /// <summary>
    ///     Validates and loads both manifest versions, then produces their diff.
    ///     Returns a non-null <see cref="LoadedManifestPair.Error" /> on any validation or 404 failure.
    /// </summary>
    private async Task<LoadedManifestPair> LoadAndCompareManifestPairAsync(
        string leftVersion,
        string rightVersion,
        CancellationToken cancellationToken)
    {
        IActionResult? leftVersionProblem = BadRequestWhenManifestVersionInvalid(leftVersion, "leftVersion");

        if (leftVersionProblem is not null)
            return new LoadedManifestPair { Error = leftVersionProblem };

        IActionResult? rightVersionProblem = BadRequestWhenManifestVersionInvalid(rightVersion, "rightVersion");

        if (rightVersionProblem is not null)
            return new LoadedManifestPair { Error = rightVersionProblem };

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return new LoadedManifestPair { Error = tenantProblem };

        VersionManifestCompareLoadResult result;

        try
        {
            result = await _compareRunsFacade.CompareManifestVersionsAsync(
                leftVersion,
                rightVersion,
                cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return new LoadedManifestPair
            {
                Error = this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed)
            };
        }

        IActionResult? mappedProblem = MapVersionManifestCompareOutcome(result);

        if (mappedProblem is not null)
            return new LoadedManifestPair { Error = mappedProblem };

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            await ManifestVersionCompareSealedManifestHashGuard.EnsurePairSealedOrThrowAsync(
                result.Left!,
                result.Right!,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return new LoadedManifestPair
            {
                Error = this.ConflictProblem(ex.Message, ProblemTypes.Conflict),
            };
        }

        return new LoadedManifestPair
        {
            Left = result.Left!,
            Right = result.Right!,
            Diff = BuildVersionCompareDiff(result),
        };
    }

    private ManifestDiffResult BuildVersionCompareDiff(VersionManifestCompareLoadResult result)
    {
        ManifestDiffResult diff = manifestDiffService.Compare(result.Left!, result.Right!);
        diff.InputFingerprints = result.InputFingerprints;
        return diff;
    }

    private IActionResult? MapVersionManifestCompareOutcome(VersionManifestCompareLoadResult result) =>
        result.Outcome switch
        {
            ManifestCompareLoadOutcome.Success => null,
            ManifestCompareLoadOutcome.BaseManifestNotFound => this.NotFoundProblem(
                $"Manifest '{result.VersionLabel}' was not found.",
                ProblemTypes.ManifestNotFound),
            ManifestCompareLoadOutcome.TargetManifestNotFound => this.NotFoundProblem(
                $"Manifest '{result.VersionLabel}' was not found.",
                ProblemTypes.ManifestNotFound),
            ManifestCompareLoadOutcome.BaseRunNotFound => this.NotFoundProblem(
                $"Run '{result.RunId}' was not found.",
                ProblemTypes.RunNotFound),
            ManifestCompareLoadOutcome.TargetRunNotFound => this.NotFoundProblem(
                $"Run '{result.RunId}' was not found.",
                ProblemTypes.RunNotFound),
            ManifestCompareLoadOutcome.BaseLifecycleIncomplete => this.ConflictProblem(
                $"Run '{result.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.TargetLifecycleIncomplete => this.ConflictProblem(
                $"Run '{result.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.PinFingerprintMismatch => this.ConflictProblem(
                "Compare blocked: create-time pin fingerprints differ between the selected runs.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.CommittedArtifactInventoryMismatch => this.ConflictProblem(
                "Compare blocked: committed artifact inventory fingerprints differ between the selected runs.",
                ProblemTypes.CommittedArtifactInventoryMismatch),
            ManifestCompareLoadOutcome.SealedManifestHashMismatch => this.ConflictProblem(
                "Compare blocked: sealed manifest hash verification failed for one or both selected runs.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected manifest compare outcome: {result.Outcome}."),
        };

    private sealed class LoadedManifestPair
    {
        public GoldenManifest? Left
        {
            get;
            init;
        }

        public GoldenManifest? Right
        {
            get;
            init;
        }

        public ManifestDiffResult? Diff
        {
            get;
            init;
        }

        public IActionResult? Error
        {
            get;
            init;
        }
    }
}
