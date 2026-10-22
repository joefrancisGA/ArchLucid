using ArchLucid.Application.Common;
using ArchLucid.Application.Telemetry;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

using ArchLucid.Api.Security;

/// <summary>
///     Accepts operator-shell client error reports for structured Serilog emission (no persistence).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/diagnostics")]
[EnableRateLimiting("fixed")]
public sealed partial class ClientErrorTelemetryController(
    ILogger<ClientErrorTelemetryController> logger,
    IScopeContextProvider scopeContextProvider,
    IFirstTenantFunnelEmitter firstTenantFunnelEmitter,
    IAuditService auditService,
    IActorContext actorContext) : ControllerBase
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IFirstTenantFunnelEmitter _firstTenantFunnelEmitter =
        firstTenantFunnelEmitter ?? throw new ArgumentNullException(nameof(firstTenantFunnelEmitter));

    private readonly ILogger<ClientErrorTelemetryController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
}
