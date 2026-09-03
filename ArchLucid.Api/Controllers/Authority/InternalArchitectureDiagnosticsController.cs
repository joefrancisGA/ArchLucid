using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Determinism;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Internal QA and pipeline diagnostics (replay, determinism, seed). Not part of the product-facing SDK surface.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed partial class InternalArchitectureDiagnosticsController(
    IReplayRunService replayRunService,
    IArchitectureApplicationService architectureApplicationService,
    IDeterminismCheckService determinismCheckService,
    IActorContext actorContext,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<InternalArchitectureDiagnosticsController> logger)
    : ControllerBase;
