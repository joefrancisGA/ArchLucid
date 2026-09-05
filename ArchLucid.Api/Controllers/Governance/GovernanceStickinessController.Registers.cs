using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceStickinessController
{
    [HttpGet("risk-register")]
    [ProducesResponseType(typeof(ArchitectureRiskRegisterResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRiskRegister(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        [FromQuery] bool assignedToMe = false,
        CancellationToken cancellationToken = default)
    {
        IActionResult? queryProblem =
            GovernanceStickinessControllerCore.ValidateRegisterListQuery(projectId, maxRows)
                .ToBadRequestProblemOrNull(this);

        if (queryProblem is not null)
            return queryProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        ArchitectureRiskRegisterResponse response = await _facade.GetRiskRegisterAsync(
            projectId,
            maxRows,
            assignedToMe,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("risk-register/assigned-to-me-count")]
    [ProducesResponseType(typeof(GovernanceAssignedToMeFindingsCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignedToMeFindingsCount(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        IActionResult? projectIdProblem =
            GovernanceStickinessControllerCore.ValidateProjectScopedQuery(projectId)
                .ToBadRequestProblemOrNull(this);

        if (projectIdProblem is not null)
            return projectIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        int count = await _facade.GetAssignedToMeFindingsCountAsync(projectId, cancellationToken);

        return Ok(new GovernanceAssignedToMeFindingsCountResponse { Count = count });
    }

    [HttpGet("reviews-awaiting-action")]
    [ProducesResponseType(typeof(GovernanceReviewsAwaitingActionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReviewsAwaitingAction(CancellationToken cancellationToken = default)
    {
        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GovernanceReviewsAwaitingActionResponse response =
            await _facade.GetReviewsAwaitingActionAsync(cancellationToken);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string fingerprint =
            $"reviews-awaiting|tenant={scope.TenantId:N}|workspace={scope.WorkspaceId:N}|project={scope.ProjectId:N}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            response,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(response, etag);
    }

    [HttpGet("decisions-needed-summary")]
    [ProducesResponseType(typeof(GovernanceDecisionsNeededSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDecisionsNeededSummary(
        [FromQuery] Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        IActionResult? projectIdProblem =
            GovernanceStickinessControllerCore.ValidateProjectScopedQuery(projectId)
                .ToBadRequestProblemOrNull(this);

        if (projectIdProblem is not null)
            return projectIdProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        GovernanceDecisionsNeededSummaryResponse response =
            await _facade.GetDecisionsNeededSummaryAsync(projectId, cancellationToken);

        string fingerprint = $"decisions-needed|project={projectId ?? scope.ProjectId}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            response,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(response, etag);
    }

    [HttpGet("findings-registers-bundle")]
    [ProducesResponseType(typeof(GovernanceFindingsRegistersBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingsRegistersBundle(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        CancellationToken cancellationToken = default)
    {
        IActionResult? queryProblem =
            GovernanceStickinessControllerCore.ValidateRegisterListQuery(projectId, maxRows)
                .ToBadRequestProblemOrNull(this);

        if (queryProblem is not null)
            return queryProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        GovernanceFindingsRegistersBundleResponse body =
            await _facade.GetFindingsRegistersBundleAsync(projectId, maxRows, cancellationToken);

        return Ok(body);
    }

    [HttpGet("decision-register")]
    [ProducesResponseType(typeof(ArchitectureDecisionRegisterResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDecisionRegister(
        [FromQuery] Guid? projectId,
        [FromQuery] int maxRows = 200,
        [FromQuery] string? category = null,
        [FromQuery] DateTimeOffset? recordedAfterUtc = null,
        [FromQuery] DateTimeOffset? recordedBeforeUtc = null,
        [FromQuery] double? minConfidence = null,
        [FromQuery] double? maxConfidence = null,
        [FromQuery] string? buyerConfidenceSource = null,
        CancellationToken cancellationToken = default)
    {
        IActionResult? queryProblem = GovernanceStickinessControllerCore.ValidateDecisionRegisterListQuery(
                projectId,
                maxRows,
                category,
                recordedAfterUtc,
                recordedBeforeUtc,
                minConfidence,
                maxConfidence,
                buyerConfidenceSource)
            .ToBadRequestProblemOrNull(this);

        if (queryProblem is not null)
            return queryProblem;

        category = category?.Trim();
        buyerConfidenceSource = buyerConfidenceSource?.Trim();

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        ArchitectureDecisionRegisterQueryOptions filters = new()
        {
            Category = category,
            RecordedAfterUtc = recordedAfterUtc,
            RecordedBeforeUtc = recordedBeforeUtc,
            MinConfidence = minConfidence,
            MaxConfidence = maxConfidence,
            BuyerConfidenceSource = buyerConfidenceSource,
        };

        ArchitectureDecisionRegisterResponse response = await _facade.GetDecisionRegisterAsync(
            projectId,
            maxRows,
            filters,
            cancellationToken);

        return Ok(response);
    }
}
