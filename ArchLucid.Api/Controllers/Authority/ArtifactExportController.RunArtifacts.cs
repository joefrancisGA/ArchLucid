using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    /// <summary>
    ///     Lists artifact descriptors for a golden manifest. Returns <c>200 OK</c> with a JSON array (possibly empty)
    ///     sorted by name then id; <c>404</c> when the manifest is missing in the current scope.
    /// </summary>
    [HttpGet("signed-review-records/{manifestId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<ArtifactDescriptorResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListArtifacts(
        Guid manifestId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        IReadOnlyList<ArtifactDescriptor> artifacts =
            await artifactQueryService.ListArtifactsByManifestIdAsync(scope, manifestId, ct);

        return Ok(artifacts.Select(a => ArtifactDescriptorResponse.From(a, manifestId)).ToList());
    }

    /// <summary>Product route: artifact descriptors for the run's golden manifest.</summary>
    [HttpGet("/v{version:apiVersion}/architecture/reviews/{runId:guid}/artifacts")]
    [HttpGet("/v{version:apiVersion}/architecture/runs/{runId:guid}/artifacts")]
    [ProducesResponseType(typeof(IReadOnlyList<ArtifactDescriptorResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListArtifactsForRun(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.Run.GoldenManifestId is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no golden manifest in the current scope.",
                ProblemTypes.ManifestNotFound);

        return await ListArtifacts(detail.Run.GoldenManifestId.Value, ct);
    }

    /// <summary>Product route: bundle ZIP for the run's golden manifest.</summary>
    [HttpGet("/v{version:apiVersion}/architecture/reviews/{runId:guid}/artifacts/bundle")]
    [HttpGet("/v{version:apiVersion}/architecture/runs/{runId:guid}/artifacts/bundle")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadBundleForRun(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.Run.GoldenManifestId is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no golden manifest in the current scope.",
                ProblemTypes.ManifestNotFound);

        return await DownloadBundle(detail.Run.GoldenManifestId.Value, ct);
    }

    /// <summary>Product route: download one artifact file for the run's golden manifest.</summary>
    [HttpGet("/v{version:apiVersion}/architecture/reviews/{runId:guid}/artifacts/{artifactId:guid}")]
    [HttpGet("/v{version:apiVersion}/architecture/runs/{runId:guid}/artifacts/{artifactId:guid}")]
    [Produces("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadArtifactForRun(Guid runId, Guid artifactId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.Run.GoldenManifestId is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no golden manifest in the current scope.",
                ProblemTypes.ManifestNotFound);

        return await DownloadArtifact(detail.Run.GoldenManifestId.Value, artifactId, ct);
    }

    /// <summary>
    ///     JSON metadata for one artifact (operator review). <c>404</c> if the manifest is out of scope or the artifact id is
    ///     not in that manifest’s bundle.
    /// </summary>
    [HttpGet("signed-review-records/{manifestId:guid}/artifact/{artifactId:guid}/descriptor")]
    [ProducesResponseType(typeof(ArtifactDescriptorResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetArtifactDescriptor(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        SynthesizedArtifact? artifact =
            await artifactQueryService.GetArtifactByIdAsync(scope, manifestId, artifactId, ct);

        if (artifact is null)
            return this.NotFoundProblem(
                $"Artifact '{artifactId}' was not found for manifest '{manifestId}'.",
                ProblemTypes.ResourceNotFound);

        return Ok(ArtifactDescriptorResponse.From(artifact));
    }

    /// <summary>
    ///     Downloads one synthesized artifact file. Requires manifest in scope; same 404 semantics as the descriptor
    ///     endpoint.
    /// </summary>
    [HttpGet("signed-review-records/{manifestId:guid}/artifact/{artifactId:guid}")]
    [Produces("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadArtifact(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        SynthesizedArtifact? artifact =
            await artifactQueryService.GetArtifactByIdAsync(scope, manifestId, artifactId, ct);

        if (artifact is null)
            return this.NotFoundProblem($"Artifact '{artifactId}' was not found for manifest '{manifestId}'.",
                ProblemTypes.ResourceNotFound);

        ArtifactFileExport file = artifactPackagingService.BuildSingleFileExport(artifact);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArtifactDownloaded, ManifestId = manifestId, ArtifactId = artifactId
            },
            ct);

        return File(file.Content, file.ContentType, file.FileName);
    }

    /// <summary>
    ///     ZIP of all artifacts for the manifest (stable entry order: name then id). <c>404</c> with manifest-not-found when
    ///     the manifest is missing; <c>404</c> with resource-not-found when the manifest exists but has no bundle or zero
    ///     artifacts.
    /// </summary>
    [HttpGet("signed-review-records/{manifestId:guid}/bundle")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadBundle(
        Guid manifestId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        if (await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct) is null)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        IReadOnlyList<SynthesizedArtifact> artifacts =
            await artifactQueryService.GetArtifactsByManifestIdAsync(scope, manifestId, ct);

        if (artifacts.Count == 0)
            return this.NotFoundProblem(
                $"Manifest '{manifestId}' has no artifact bundle or the bundle contains no artifacts. " +
                $"The list endpoint GET api/artifacts/manifests/{manifestId} returns an empty JSON array when there are no artifact rows.",
                ProblemTypes.ResourceNotFound);

        ArtifactPackage package = artifactPackagingService.BuildBundlePackage(manifestId, artifacts);

        await auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.BundleDownloaded, ManifestId = manifestId },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }
}
