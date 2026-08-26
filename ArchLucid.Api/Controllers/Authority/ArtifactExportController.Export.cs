using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Security;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Exports;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    /// <summary>Downloads the ADR 0052 decision receipt JSON for a committed infeasible run.</summary>
    [HttpGet("reviews/{runId:guid}/decision-receipt")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadRunDecisionReceipt(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        DecisionReceiptDocument? receipt =
            await decisionReceiptService.BuildForRunAsync(scope, runId, ct);

        if (receipt is null)
            return this.NotFoundProblem(
                $"Decision receipt for run '{runId}' was not found or is not exportable.",
                ProblemTypes.ManifestNotFound);

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

                string? mermaid = MermaidDiagramArtifactExtractor.TryGetDiagramSource(artifactsForDiagram);

                if (!string.IsNullOrWhiteSpace(mermaid))
                    renderedPng = await diagramImageRenderer.RenderMermaidPngAsync(mermaid, ct);
            }
        }

        RunExportPackageResult packageResult =
            await runExportPackageBuilder.BuildAsync(scope, runId, renderedPng, ct);

        if (!packageResult.Found)
            return this.NotFoundProblem(packageResult.NotFoundReason!, packageResult.ProblemType);

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
    ///     Recomputes the golden manifest hash and compares it to the commit-time <c>ManifestGenerated</c> audit anchor.
    ///     Returns <c>200 OK</c> with status <c>Match</c>, <c>Mismatch</c>, or <c>NotAttested</c> (read-only; no repair).
    /// </summary>
    [HttpGet("reviews/{runId:guid}/export/verify")]
    [HttpGet("runs/{runId:guid}/export/verify")]
    [ProducesResponseType(typeof(RunExportLineageVerificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> VerifyRunExportLineage(Guid runId, CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunExportLineageVerificationResult? result = await runExportLineageVerifier.VerifyAsync(scope, runId, ct);

        if (result is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        return Ok(RunExportLineageVerificationResponse.From(result));
    }

    /// <summary>
    ///     Advisory Terraform ZIP for a run (placeholder README + stub file; CLI aztfexport wrapping is documented in README).
    /// </summary>
    [HttpGet("reviews/{runId:guid}/terraform-advisory-export")]
    [HttpGet("runs/{runId:guid}/terraform-advisory-export")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
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

        ArtifactPackage package = artifactPackagingService.BuildTerraformAdvisoryPlaceholderExport(runId);

        await auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.TerraformAdvisoryExportDownloaded, RunId = runId },
            ct);

        return File(package.Content, package.ContentType, package.PackageFileName);
    }

    /// <summary>
    ///     Enqueues a durable run export ZIP push to a customer-provided Azure Blob SAS URL.
    ///     Returns 202 Accepted immediately; a leader-elected worker drains <c>dbo.RunExportBlobPushOutbox</c>.
    ///     Durable <c>RunExportBlobPushQueued</c> fires at accept; completion audits are
    ///     <c>RunExportBlobPushSucceeded</c> / <c>RunExportBlobPushFailed</c> / <c>RunExportBlobPushDeadLettered</c>.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("reviews/{runId:guid}/export/push")]
    [HttpPost("runs/{runId:guid}/export/push")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PushRunExportToBlob(
        Guid runId,
        [FromBody] RunExportBlobPushRequest? request,
        CancellationToken ct = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.DestinationSasUrl))
            return this.BadRequestProblem("DestinationSasUrl is required.", ProblemTypes.RequestBodyRequired);

        string? sasRejection =
            await AllowedRunExportBlobDestinationUrlPolicy
                .TryGetRejectionReasonAfterDnsResolveAsync(request.DestinationSasUrl, ct)
                .ConfigureAwait(false);

        if (sasRejection is not null)
            return this.BadRequestProblem(sasRejection, ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? runDetail = await authorityQueryService.GetRunDetailAsync(scope, runId, ct);

        if (runDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (runDetail.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Run '{runId}' has no committed golden manifest available for export.",
                ProblemTypes.ManifestNotFound);

        await runExportBlobPushOutbox.EnqueueAsync(
            runId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            request.DestinationSasUrl,
            ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunExportBlobPushQueued,
                RunId = runId
            },
            ct);

        return Accepted();
    }

    /// <summary>
    ///     Creates an advisory Terraform GitHub Pull Request for the given run.
    ///     Generates the Terraform placeholder ZIP then pushes the files to GitHub and opens a PR on the
    ///     configured repository. Returns <c>201 Created</c> with the PR URL on success.
    ///     Requires <c>TerraformGitHubPr:Enabled=true</c> and valid GitHub credentials in configuration.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("reviews/{runId:guid}/terraform-pr")]
    [HttpPost("runs/{runId:guid}/terraform-pr")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TerraformPrCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateTerraformPr(
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

        ArtifactPackage package = artifactPackagingService.BuildTerraformAdvisoryPlaceholderExport(runId);

        try
        {
            TerraformPrCreationResult result = await terraformGitHubPrService
                .CreatePrAsync(runId, package.Content, ct)
                .ConfigureAwait(false);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TerraformAdvisoryExportDownloaded,
                    RunId = runId,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        source = "github_pr",
                        prUrl = result.PullRequestUrl,
                        branch = result.BranchName
                    })
                }, ct);

            return CreatedAtAction(
                nameof(DownloadTerraformAdvisoryExport),
                new { runId },
                new TerraformPrCreatedResponse
                {
                    PullRequestUrl = result.PullRequestUrl,
                    PullRequestNumber = result.PullRequestNumber,
                    BranchName = result.BranchName
                });
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }
    }
}
