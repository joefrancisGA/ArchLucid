using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Api.Contracts;
using ArchiForge.ArtifactSynthesis.Packaging;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Persistence.Queries;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/artifacts")]
[EnableRateLimiting("fixed")]
public sealed class ArtifactExportController(
    IArtifactQueryService artifactQueryService,
    IAuthorityQueryService authorityQueryService,
    IArtifactPackagingService artifactPackagingService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService)
    : ControllerBase
{
    private static readonly JsonSerializerOptions ExportJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [HttpGet("manifests/{manifestId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<ArtifactDescriptorResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ArtifactDescriptorResponse>>> ListArtifacts(
        Guid manifestId,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var artifacts = await artifactQueryService.ListArtifactsByManifestIdAsync(scope, manifestId, ct);

        return Ok(artifacts.Select(x => new ArtifactDescriptorResponse
        {
            ArtifactId = x.ArtifactId,
            ArtifactType = x.ArtifactType,
            Name = x.Name,
            Format = x.Format,
            CreatedUtc = x.CreatedUtc,
            ContentHash = x.ContentHash
        }).ToList());
    }

    [HttpGet("manifests/{manifestId:guid}/artifact/{artifactId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadArtifact(
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var artifact = await artifactQueryService.GetArtifactByIdAsync(scope, manifestId, artifactId, ct);
        if (artifact is null)
            return NotFound();

        var file = artifactPackagingService.BuildSingleFileExport(artifact);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArtifactDownloaded,
                ManifestId = manifestId,
                ArtifactId = artifactId
            },
            ct);

        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("manifests/{manifestId:guid}/bundle")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadBundle(
        Guid manifestId,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var artifacts = await artifactQueryService.GetArtifactsByManifestIdAsync(scope, manifestId, ct);
        if (artifacts.Count == 0)
            return NotFound();

        var package = artifactPackagingService.BuildBundlePackage(manifestId, artifacts);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.BundleDownloaded,
                ManifestId = manifestId
            },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }

    [HttpGet("runs/{runId:guid}/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadRunExport(
        Guid runId,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (runDetail is null || runDetail.GoldenManifest is null)
            return NotFound();

        var artifacts = await artifactQueryService.GetArtifactsByManifestIdAsync(
            scope,
            runDetail.GoldenManifest.ManifestId,
            ct);

        var manifestJson = JsonSerializer.Serialize(runDetail.GoldenManifest, ExportJsonOptions);

        var traceJson = runDetail.DecisionTrace is null
            ? null
            : JsonSerializer.Serialize(runDetail.DecisionTrace, ExportJsonOptions);

        var package = artifactPackagingService.BuildRunExportPackage(
            runId,
            runDetail.GoldenManifest.ManifestId,
            artifacts,
            manifestJson,
            traceJson);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunExported,
                RunId = runId,
                ManifestId = runDetail.GoldenManifest.ManifestId
            },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }
}
