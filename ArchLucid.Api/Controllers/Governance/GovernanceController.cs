using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Primitives;

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
    IGovernanceWorkflowService workflowService,
    IGovernanceApprovalRequestRepository approvalRepo,
    IGovernancePromotionRecordRepository promotionRepo,
    IGovernanceEnvironmentActivationRepository activationRepo,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IGovernanceDashboardService governanceDashboardService,
    IGovernanceLineageService governanceLineageService,
    IGovernanceRationaleService governanceRationaleService,
    IComplianceDriftTrendService complianceDriftTrendService,
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
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IComplianceDriftTrendService _complianceDriftTrendService =
        complianceDriftTrendService ?? throw new ArgumentNullException(nameof(complianceDriftTrendService));

    private readonly IGovernanceDashboardService _governanceDashboardService =
        governanceDashboardService ?? throw new ArgumentNullException(nameof(governanceDashboardService));

    private readonly IGovernanceLineageService _governanceLineageService =
        governanceLineageService ?? throw new ArgumentNullException(nameof(governanceLineageService));

    private readonly IGovernanceRationaleService _governanceRationaleService =
        governanceRationaleService ?? throw new ArgumentNullException(nameof(governanceRationaleService));

    private readonly IPolicyPackDryRunService _policyPackDryRunService =
        policyPackDryRunService ?? throw new ArgumentNullException(nameof(policyPackDryRunService));

    private readonly IPolicyPackGovernanceDryRunService _policyPackGovernanceDryRunService =
        policyPackGovernanceDryRunService ?? throw new ArgumentNullException(nameof(policyPackGovernanceDryRunService));

    private readonly IPolicyPackSchemaKeysService _policyPackSchemaKeysService =
        policyPackSchemaKeysService ?? throw new ArgumentNullException(nameof(policyPackSchemaKeysService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private async Task<IActionResult?> RequireTenantOrNotFoundAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        return null;
    }

    private static string NormalizeApprovalRequestId(string approvalRequestId) =>
        approvalRequestId.Trim();

}
