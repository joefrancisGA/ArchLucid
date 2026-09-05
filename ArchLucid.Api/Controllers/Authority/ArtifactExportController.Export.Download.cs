using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Exports;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Exports;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    /// <summary>Downloads the ADR 0052 decision receipt JSON for a committed infeasible run.</summary>
    [HttpGet("reviews/{runId:guid}/decision-receipt")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadRunDecisionReceipt(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        DecisionReceiptRunBuildResult buildResult =
            await decisionReceiptService.BuildForRunAsync(scope, runId, ct);

        if (buildResult.Outcome == DecisionReceiptRunBuildOutcome.SealedHashMismatch)
        {
            return this.ConflictProblem(
                $"Decision receipt for run '{runId}' failed sealed-hash verification.",
                ProblemTypes.DecisionReceiptSealedHashMismatch);
        }

        if (buildResult.Outcome == DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete)
        {
            return this.ConflictProblem(
                $"Decision receipt for run '{runId}' is missing sealed receipt fields required for export.",
                ProblemTypes.DecisionReceiptSealedIncomplete);
        }

        if (buildResult.Outcome != DecisionReceiptRunBuildOutcome.Success || buildResult.Receipt is null)
        {
            return this.NotFoundProblem(
                $"Decision receipt for run '{runId}' was not found or is not exportable.",
                ProblemTypes.ManifestNotFound);
        }

        DecisionReceiptDocument receipt = buildResult.Receipt;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.DecisionReceiptExported,
                RunId = runId,
            },
            ct);

        string json = JsonSerializer.Serialize(receipt, new JsonSerializerOptions { WriteIndented = true });
        byte[] body = System.Text.Encoding.UTF8.GetBytes(json);

        return File(body, "application/json", DecisionReceiptComposer.BuildFilename(receipt.DraftId, receipt.RunId));
    }

    /// <summary>
    ///     ZIP export of run manifest, trace, and artifacts when the run is committed; artifacts ordered like the
    ///     manifest bundle list.
    /// </summary>
    [HttpGet("reviews/{runId:guid}/export")]
    [HttpGet("runs/{runId:guid}/export")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadRunExport(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        byte[]? renderedPng = null;

        if (configuration.GetValue("ArchLucid:MermaidCli:Enabled", false))
        {
            RunDetailDto? runDetailForDiagram = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

            if (runDetailForDiagram?.GoldenManifest is not null)
            {
                IReadOnlyList<SynthesizedArtifact> artifactsForDiagram =
                    await artifactQueryService.GetArtifactsByManifestIdAsync(
                        scope,
                        runDetailForDiagram.GoldenManifest.ManifestId,
                        ct);

                try
                {
                    MermaidDiagramExportInventoryGuard.EnsureDiagramSourceInventoryBoundOrThrow(
                        runDetailForDiagram.GoldenManifest,
                        artifactsForDiagram,
                        runId.ToString("D"));
                }
                catch (ConflictException ex)
                {
                    return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
                }

                string? mermaid = MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifactsForDiagram);

                if (!string.IsNullOrWhiteSpace(mermaid))
                {
                    string brandedMermaid = await brandedDiagramExportService.DecorateMermaidSourceForExportAsync(
                        scope.TenantId,
                        mermaid,
                        BrandingDisplayContext.ArchitectureDiagram,
                        ct);

                    renderedPng = await diagramImageRenderer.RenderMermaidPngAsync(brandedMermaid, ct);
                    renderedPng = await brandedDiagramExportService.WrapRenderedPngForExportAsync(
                        scope.TenantId,
                        renderedPng,
                        BrandingDisplayContext.ArchitectureDiagram,
                        ct);
                }
            }
        }

        RunExportPackageResult packageResult =
            await runExportPackageBuilder.BuildAsync(scope, runId, renderedPng, ct);

        if (!packageResult.Found)
        {
            if (packageResult.IsConflict)
            {
                return this.ConflictProblem(
                    packageResult.NotFoundReason!,
                    packageResult.ProblemType ?? ProblemTypes.DecisionReceiptSealedHashMismatch);
            }

            return this.NotFoundProblem(packageResult.NotFoundReason!, packageResult.ProblemType);
        }

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunExported,
                RunId = runId,
                ManifestId = packageResult.ManifestId
            },
            ct);

        return File(packageResult.ZipContent!, packageResult.ContentType!, packageResult.PackageFileName!);
    }

    /// <summary>
    ///     Advisory Terraform ZIP for a run (placeholder README + stub file; CLI aztfexport wrapping is documented in README).
    /// </summary>
    [HttpGet("reviews/{runId:guid}/terraform-advisory-export")]
    [HttpGet("runs/{runId:guid}/terraform-advisory-export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK, "application/zip")]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadTerraformAdvisoryExport(
        Guid runId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (runDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (runDetail.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no committed golden manifest available for export.",
                ProblemTypes.ManifestNotFound);

        IActionResult? sealedHashProblem = EnsureSealedManifestHashOrConflict(runDetail.GoldenManifest, runId.ToString("D"));

        if (sealedHashProblem is not null)
            return sealedHashProblem;

        ArtifactPackage package = artifactPackagingService.BuildTerraformAdvisoryPlaceholderExport(runId);

        await auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.TerraformAdvisoryExportDownloaded, RunId = runId },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }
}
