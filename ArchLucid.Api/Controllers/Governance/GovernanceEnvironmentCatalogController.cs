using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Administrator configuration for governance environment slots and allowed transitions.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance/environment-catalog")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class GovernanceEnvironmentCatalogController(
    IScopeContextProvider scopeProvider,
    IGovernanceEnvironmentCatalogService catalogService,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IGovernanceEnvironmentCatalogService _catalogService =
        catalogService ?? throw new ArgumentNullException(nameof(catalogService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Returns the effective environment catalog for the current scope.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(GovernanceEnvironmentCatalog), StatusCodes.Status200OK)]
    public async Task<ActionResult<GovernanceEnvironmentCatalog>> Get(CancellationToken cancellationToken = default)
    {
        GovernanceEnvironmentCatalog catalog = await _catalogService
            .GetCatalogAsync(cancellationToken)
            .ConfigureAwait(false);

        return Ok(catalog);
    }

    /// <summary>Replaces the environment catalog and allowed transitions for the current scope.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(GovernanceEnvironmentCatalog), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Replace(
        [FromBody] ReplaceGovernanceEnvironmentCatalogRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            await _catalogService.ReplaceCatalogAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        GovernanceEnvironmentCatalog catalog = await _catalogService
            .GetCatalogAsync(cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.GovernanceEnvironmentCatalogReplaced,
                DataJson = JsonSerializer.Serialize(new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    environmentCount = catalog.Environments.Count,
                    transitionCount = catalog.Transitions.Count,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(catalog);
    }
}
