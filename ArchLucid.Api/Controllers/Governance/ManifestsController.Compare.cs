using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

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

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

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

        if (right is null)
        {
            return new LoadedManifestPair
            {
                Error = this.NotFoundProblem($"Manifest '{rightVersion}' was not found.",
                    ProblemTypes.ManifestNotFound)
            };
        }

        await EnsureManifestCompareFingerprintsMatchOrThrowAsync(left, right, cancellationToken);

        return new LoadedManifestPair { Left = left, Right = right, Diff = manifestDiffService.Compare(left, right) };
    }

    private async Task EnsureManifestCompareFingerprintsMatchOrThrowAsync(
        GoldenManifest left,
        GoldenManifest right,
        CancellationToken cancellationToken)
    {
        if (!AuthorityRunIdentifier.TryParse(left.RunId, out Guid leftRunGuid)
            || !AuthorityRunIdentifier.TryParse(right.RunId, out Guid rightRunGuid))
        {
            throw new ConflictException(
                "Compare blocked: both manifests must reference resolvable run ids with create-time pin headers.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? leftHeader = await _runRepository.GetByIdAsync(scope, leftRunGuid, cancellationToken);
        RunRecord? rightHeader = await _runRepository.GetByIdAsync(scope, rightRunGuid, cancellationToken);

        if (leftHeader is null || rightHeader is null)
        {
            throw new ConflictException(
                "Compare blocked: one or both manifest runs are missing persisted headers for pin fingerprint verification.");
        }

        RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(leftHeader, rightHeader);

        Task<RunDetailDto?> leftDetailTask =
            _authorityQueryService.GetRunDetailForManifestCompareAsync(scope, leftRunGuid, cancellationToken);
        Task<RunDetailDto?> rightDetailTask =
            _authorityQueryService.GetRunDetailForManifestCompareAsync(scope, rightRunGuid, cancellationToken);
        await Task.WhenAll(leftDetailTask, rightDetailTask);

        RunDetailDto? leftDetail = await leftDetailTask;
        RunDetailDto? rightDetail = await rightDetailTask;

        if (leftDetail?.GoldenManifest is null || rightDetail?.GoldenManifest is null)
        {
            throw new ConflictException(
                "Compare blocked: committed artifact inventory requires hydrated golden manifests for both runs.");
        }

        RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                leftDetail.GoldenManifest.CommittedArtifactInventory),
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(
                rightDetail.GoldenManifest.CommittedArtifactInventory));
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
