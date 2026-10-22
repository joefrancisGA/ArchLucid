using ArchLucid.Api.Attributes;
using ArchLucid.Application.Alerts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Host.Core.Services;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>
///     Lists alerts and applies lifecycle actions (acknowledge / resolve / suppress) for the caller’s
///     tenant/workspace/project scope.
/// </summary>
/// <remarks>
///     Scope comes from <see cref="IScopeContextProvider" />; alert <strong>evaluation</strong> is performed by
///     orchestration paths
///     (<c>AlertService</c> / composite service), not from this controller. Outbound delivery filters are configured on
///     <c>POST /v1/alert-routing-subscriptions</c> (<see cref="AlertRoutingSubscriptionsController" />).
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/alerts")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class AlertsController(
    IScopeContextProvider scopeProvider,
    IAlertRecordRepository alertRepository,
    IAlertRuleRepository alertRuleRepository,
    IAuthorityQueryService authorityQueryService,
    IAlertService alertService,
    IAlertActionLoopReader actionLoopReader,
    IAuditService auditService)
    : ControllerBase
{
    private readonly IAlertRuleRepository _alertRuleRepository =
        alertRuleRepository ?? throw new ArgumentNullException(nameof(alertRuleRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IAlertActionLoopReader _actionLoopReader =
        actionLoopReader ?? throw new ArgumentNullException(nameof(actionLoopReader));
}
