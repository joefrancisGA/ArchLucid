using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Manifest;

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
            LeftManifestVersion = leftVersion,
            RightManifestVersion = rightVersion,
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

        return Ok(new ManifestCompareExportResponse
        {
            LeftManifestVersion = leftVersion,
            RightManifestVersion = rightVersion,
            Format = FormatMarkdown,
            FileName = $"compare_{leftVersion}_to_{rightVersion}.md",
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

        string fileName = $"compare_{leftVersion}_to_{rightVersion}.md";
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
        if (string.IsNullOrWhiteSpace(leftVersion))
            return new LoadedManifestPair
            {
                Error = this.BadRequestProblem("leftVersion is required.", ProblemTypes.ValidationFailed)
            };

        if (string.IsNullOrWhiteSpace(rightVersion))
            return new LoadedManifestPair
            {
                Error = this.BadRequestProblem("rightVersion is required.", ProblemTypes.ValidationFailed)
            };

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return new LoadedManifestPair { Error = tenantProblem };

        GoldenManifest? left = await GetManifestInScopeAsync(leftVersion, cancellationToken);

        if (left is null)
            return new LoadedManifestPair
            {
                Error = this.NotFoundProblem($"Manifest '{leftVersion}' was not found.",
                    ProblemTypes.ManifestNotFound)
            };

        GoldenManifest? right = await GetManifestInScopeAsync(rightVersion, cancellationToken);

        return right is null
            ? new LoadedManifestPair
            {
                Error = this.NotFoundProblem($"Manifest '{rightVersion}' was not found.",
                    ProblemTypes.ManifestNotFound)
            }
            : new LoadedManifestPair { Left = left, Right = right, Diff = manifestDiffService.Compare(left, right) };
    }

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
