using ArchiForge.Api.Auth.Models;
using ArchiForge.AgentRuntime.Explanation;
using ArchiForge.ArtifactSynthesis.Docx;
using ArchiForge.ArtifactSynthesis.Docx.Models;
using ArchiForge.Core.Comparison;
using ArchiForge.Core.Explanation;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Comparison;
using ArchiForge.Persistence.Provenance;
using ArchiForge.Persistence.Queries;
using ArchiForge.Provenance;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/docx")]
[EnableRateLimiting("fixed")]
public sealed class DocxExportController(
    IAuthorityQueryService authorityQueryService,
    IArtifactQueryService artifactQueryService,
    IDocxExportService docxExportService,
    IComparisonService comparisonService,
    IExplanationService explanationService,
    IProvenanceSnapshotRepository provenanceSnapshotRepository,
    IScopeContextProvider scopeProvider)
    : ControllerBase
{
    [HttpGet("runs/{runId:guid}/architecture-package")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportRunDocx(
        Guid runId,
        [FromQuery] Guid? compareWithRunId,
        [FromQuery] bool explainRun = false,
        [FromQuery] bool includeComparisonExplanation = true,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);
        if (runDetail?.GoldenManifest is null)
            return NotFound();

        var manifest = runDetail.GoldenManifest;
        var artifacts = await artifactQueryService.GetArtifactsByManifestIdAsync(
            scope,
            manifest.ManifestId,
            ct);

        ComparisonResult? manifestComparison = null;
        if (compareWithRunId is not null)
        {
            var targetDetail = await authorityQueryService.GetRunDetailAsync(scope, compareWithRunId.Value, ct);
            if (targetDetail?.GoldenManifest is null)
                return NotFound();
            manifestComparison = comparisonService.Compare(manifest, targetDetail.GoldenManifest);
        }

        ComparisonExplanationResult? comparisonNarrative = null;
        if (manifestComparison is not null && includeComparisonExplanation)
            comparisonNarrative = await explanationService.ExplainComparisonAsync(manifestComparison, ct);

        ExplanationResult? runNarrative = null;
        if (explainRun)
        {
            var snapshot = await provenanceSnapshotRepository.GetByRunIdAsync(scope, runId, ct);
            var graph = snapshot is null ? null : ProvenanceGraphSerializer.Deserialize(snapshot.GraphJson);
            runNarrative = await explanationService.ExplainRunAsync(manifest, graph, ct);
        }

        var result = await docxExportService.ExportAsync(
            DocxExportRequest.ForArchitecturePackage(
                runId,
                manifest.ManifestId,
                "ArchiForge Architecture Package",
                $"Generated for Run {runId}",
                manifestComparison,
                comparisonNarrative,
                runNarrative,
                runDetail.FindingsSnapshot),
            manifest,
            artifacts,
            ct);

        return File(result.Content, result.ContentType, result.FileName);
    }
}
