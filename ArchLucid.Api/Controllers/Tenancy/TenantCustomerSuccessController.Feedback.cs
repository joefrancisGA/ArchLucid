using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Http.Tenancy;
using ArchLucid.Api.Models.CustomerSuccess;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantCustomerSuccessController
{
    /// <summary>Records thumbs feedback for product instrumentation.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("product-feedback")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> PostProductFeedbackAsync(
        [FromBody] ProductFeedbackRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            ProductFeedbackHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        (IActionResult? scopeProblem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        if (request.RunId is Guid runId)
        {
            RunRecord? run = await _runRepository
                .GetByIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);

            if (run is null)
            {
                return this.NotFoundProblem(
                    $"Run '{runId:D}' was not found.",
                    ProblemTypes.RunNotFound);
            }
        }

        string? findingRef = null;

        if (!string.IsNullOrWhiteSpace(request.FindingRef))
        {
            string trimmedFindingRef = request.FindingRef.Trim();

            FindingInspectResponse? finding = await _findingInspectReadRepository
                .GetInspectAsync(scope, trimmedFindingRef, cancellationToken, FindingInspectReadOptions.MetadataOnly)
                .ConfigureAwait(false);

            if (finding is null)
            {
                return this.NotFoundProblem(
                    $"Finding '{trimmedFindingRef}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            IActionResult? runBindingProblem =
                ProductFeedbackHttpMapper.ValidateRunMatchesFindingAuthorityRun(request.RunId, finding)
                    .ToBadRequestProblemOrNull(this);

            if (runBindingProblem is not null)
                return runBindingProblem;

            findingRef = finding.FindingId;
        }

        string? comment = string.IsNullOrWhiteSpace(request.Comment)
            ? null
            : request.Comment.Trim();

        ProductFeedbackSubmission submission = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FindingRef = findingRef,
            RunId = request.RunId,
            Score = request.Score,
            Comment = comment
        };

        await _customerSuccessRepository.InsertProductFeedbackAsync(submission, cancellationToken)
            .ConfigureAwait(false);

        return NoContent();
    }
}
