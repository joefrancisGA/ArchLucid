using System.Text.Json;

using ArchLucid.Api.Models.Diagnostics;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Diagnostics;

/// <summary>
///     Reinitializes the local development SQL catalog to the first-install baseline (Development hosts only).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.RequireAdmin)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/diagnostics")]
[EnableRateLimiting("expensive")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class DevelopmentCatalogResetController(
    IDevelopmentCatalogResetService resetService,
    IWebHostEnvironment environment,
    IConfiguration configuration,
    IAuditService auditService,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IDevelopmentCatalogResetService _resetService =
        resetService ?? throw new ArgumentNullException(nameof(resetService));

    private readonly IWebHostEnvironment _environment =
        environment ?? throw new ArgumentNullException(nameof(environment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <summary>Drops and recreates the configured development catalog, then replays install-time persistence bootstrap.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("reset-development-catalog")]
    [ProducesResponseType(typeof(DevelopmentCatalogResetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostAsync(CancellationToken cancellationToken = default)
    {
        if (!_environment.IsDevelopment())
        {
            return this.NotFoundProblem(
                "Development catalog reset is available only when the host environment is Development.",
                ProblemTypes.ResourceNotFound);
        }

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(_configuration);

        if (!ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
        {
            return this.BadRequestProblem(
                "Development catalog reset requires ArchLucid:StorageProvider=Sql.",
                ProblemTypes.BadRequest);
        }

        DevelopmentCatalogResetResult result;

        try
        {
            result = await _resetService.ResetToFreshInstallAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string auditActor = _actorContext.GetActor();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.DevelopmentCatalogResetInvoked,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        catalogName = result.CatalogName,
                        demoSeedApplied = result.DemoSeedApplied,
                        hostIsDevelopment = _environment.IsDevelopment(),
                    }),
            },
            cancellationToken);

        return Ok(
            new DevelopmentCatalogResetResponse
            {
                CatalogName = result.CatalogName,
                DemoSeedApplied = result.DemoSeedApplied,
            });
    }
}
