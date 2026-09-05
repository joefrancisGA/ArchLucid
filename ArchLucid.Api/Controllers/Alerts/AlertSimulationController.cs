using ArchLucid.Api.Attributes;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Alerts.Simulation;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>
///     HTTP API for alert rule what-if simulation and A/B comparison over the caller’s scope (read authority).
/// </summary>
/// <remarks>
///     Stamps tenant/workspace/project on embedded rule DTOs from <see cref="IScopeContextProvider" /> before invoking
///     <see cref="IRuleSimulationService" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/alert-simulation")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class AlertSimulationController(
    IScopeContextProvider scopeProvider,
    IRuleSimulationService simulationService,
    IAuditService auditService)
    : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IRuleSimulationService _simulationService =
        simulationService ?? throw new ArgumentNullException(nameof(simulationService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));
}
