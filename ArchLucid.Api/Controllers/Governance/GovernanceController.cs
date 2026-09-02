using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Governance workflow: approval requests, promotions, and environment activations for run manifests.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed partial class GovernanceController(
    IGovernanceApprovalRequestsFacade approvalRequestsFacade,
    IGovernancePromotionsActivationsFacade promotionsActivationsFacade,
    IGovernanceInsightsFacade insightsFacade,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IPolicyPackDryRunService policyPackDryRunService,
    IPolicyPackGovernanceDryRunService policyPackGovernanceDryRunService,
    IPolicyPackSchemaKeysService policyPackSchemaKeysService,
    IAuditService auditService,
    IPolicyPackDraftService policyPackDraftService,
    IPolicyPackGeneratorService policyPackGeneratorService,
    ITenantRepository tenantRepository,
    ILogger<GovernanceController> logger)
    : ControllerBase
{
    private const int ComplianceDriftTrendMaxBuckets = 500;

    private readonly IGovernanceApprovalRequestsFacade _approvalRequestsFacade =
        approvalRequestsFacade ?? throw new ArgumentNullException(nameof(approvalRequestsFacade));

    private readonly IGovernancePromotionsActivationsFacade _promotionsActivationsFacade =
        promotionsActivationsFacade ?? throw new ArgumentNullException(nameof(promotionsActivationsFacade));

    private readonly IGovernanceInsightsFacade _insightsFacade =
        insightsFacade ?? throw new ArgumentNullException(nameof(insightsFacade));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IPolicyPackDryRunService _policyPackDryRunService =
        policyPackDryRunService ?? throw new ArgumentNullException(nameof(policyPackDryRunService));

    private readonly IPolicyPackGovernanceDryRunService _policyPackGovernanceDryRunService =
        policyPackGovernanceDryRunService ?? throw new ArgumentNullException(nameof(policyPackGovernanceDryRunService));

    private readonly IPolicyPackSchemaKeysService _policyPackSchemaKeysService =
        policyPackSchemaKeysService ?? throw new ArgumentNullException(nameof(policyPackSchemaKeysService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private async Task<IActionResult?> RequireTenantAndWorkspaceOrNotFoundAsync(CancellationToken cancellationToken)
    {
        (IActionResult? problem, _) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeContextProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return problem;
    }

    private static string NormalizeApprovalRequestId(string approvalRequestId) =>
        approvalRequestId.Trim();

    private IActionResult? BadRequestWhenApprovalRequestIdEmpty(string approvalRequestId)
    {
        if (string.IsNullOrWhiteSpace(approvalRequestId))
            return this.BadRequestProblem("approvalRequestId is required.", ProblemTypes.ValidationFailed);

        return null;
    }
}
