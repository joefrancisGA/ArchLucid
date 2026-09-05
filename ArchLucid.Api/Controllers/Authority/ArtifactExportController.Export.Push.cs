using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
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
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
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

        IActionResult? sealedHashProblem = EnsureSealedManifestHashOrConflict(runDetail.GoldenManifest, runId.ToString("D"));

        if (sealedHashProblem is not null)
            return sealedHashProblem;

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
