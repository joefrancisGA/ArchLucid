using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
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
    IAuditService auditService,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IGovernanceEnvironmentCatalogService _catalogService =
        catalogService ?? throw new ArgumentNullException(nameof(catalogService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>Returns the effective environment catalog for the current scope.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(GovernanceEnvironmentCatalog), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IActionResult? scopeProblem = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            scope,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Replace(
        [FromBody] ReplaceGovernanceEnvironmentCatalogRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? catalogProblem = BadRequestWhenReplaceCatalogInvalid(request);

        if (catalogProblem is not null)
            return catalogProblem;

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IActionResult? scopeProblem = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            scope,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        GovernanceEnvironmentCatalog existingCatalog = await _catalogService
            .GetCatalogAsync(cancellationToken)
            .ConfigureAwait(false);

        GovernanceEnvironmentCatalog normalizedRequest = GovernanceEnvironmentCatalogService.NormalizeCatalog(
            new GovernanceEnvironmentCatalog
            {
                Environments = request.Environments,
                Transitions = request.Transitions,
            });

        bool isIdenticalRetry = existingCatalog.IsAdministratorConfigured
            && GovernanceEnvironmentCatalogService.CatalogContentEquals(existingCatalog, normalizedRequest);

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

        if (!isIdenticalRetry)
        {
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
        }

        return Ok(catalog);
    }

    private IActionResult? BadRequestWhenReplaceCatalogInvalid(ReplaceGovernanceEnvironmentCatalogRequest request)
    {
        try
        {
            GovernanceEnvironmentCatalog normalized = GovernanceEnvironmentCatalogService.NormalizeCatalog(
                new GovernanceEnvironmentCatalog
                {
                    Environments = request.Environments,
                    Transitions = request.Transitions,
                });

            GovernanceEnvironmentCatalogService.ValidateCatalogOrThrow(normalized);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return null;
    }
}
