using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Per-tenant integration posture for connector operations (read-only, no secrets).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/integrations/operations")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantIntegrationsOperationsController(
    IScopeContextProvider scopeProvider,
    IConnectorOperationsSummaryReader summaryReader,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IConnectorOperationsSummaryReader _summaryReader =
        summaryReader ?? throw new ArgumentNullException(nameof(summaryReader));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>Connector readiness rows, digest/advisory loop summary, and Service Bus posture for the active scope.</summary>
    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantIntegrationsOperationsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        ConnectorOperationsSummary summary =
            await _summaryReader.GetSummaryAsync(scope, cancellationToken).ConfigureAwait(false);

        TenantIntegrationsOperationsResponse body = new()
        {
            Connectors = summary.Surfaces
                .Select(static s => new ConnectorSurfaceStatusResponse
                {
                    ConnectorKey = s.ConnectorKey,
                    DisplayName = s.DisplayName,
                    IsConfigured = s.IsConfigured,
                    SmokeReadiness = s.SmokeReadiness,
                    Summary = s.Summary,
                    ConfigurationHref = s.ConfigurationHref,
                })
                .ToList(),
            IntegrationEventBus = new IntegrationEventBusStatusResponse
            {
                PublisherConfigured = summary.IntegrationEventBus.PublisherConfigured,
                TransactionalOutboxEnabled = summary.IntegrationEventBus.TransactionalOutboxEnabled,
                ConsumerConfigured = summary.IntegrationEventBus.ConsumerConfigured,
                QueueOrTopicName = summary.IntegrationEventBus.QueueOrTopicName,
                FullyQualifiedNamespace = summary.IntegrationEventBus.FullyQualifiedNamespace,
                UsesLegacyConnectionString = summary.IntegrationEventBus.UsesLegacyConnectionString,
                SmokeReadiness = summary.IntegrationEventBus.SmokeReadiness,
            },
        };

        return Ok(body);
    }
}
