using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Admin endpoints for Tier 2 hosted Azure extractor (Workload Identity Federation — no customer secrets stored).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/azure-extractor/hosted")]
public sealed class HostedAzureExtractorAdminController(
    IHostedAzureExtractorConfigurationService configurationService,
    ITenantHostedExtractorConfigurationRepository configurationRepository,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly IHostedAzureExtractorConfigurationService _configurationService =
        configurationService ?? throw new ArgumentNullException(nameof(configurationService));

    private readonly ITenantHostedExtractorConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("configure")]
    [ProducesResponseType(typeof(HostedAzureExtractorConfigurationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfigureAsync(
        [FromBody] HostedAzureExtractorConfigureBody body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        TenantHostedExtractorConfigurationRecord record;

        try
        {
            record = await _configurationService
                .ConfigureAsync(
                    scope.TenantId,
                    actorId,
                    new HostedAzureExtractorConfigureRequest
                    {
                        CustomerTenantId = body.CustomerTenantId,
                        CustomerAppId = body.CustomerAppId,
                        SubscriptionId = body.SubscriptionId,
                        IncludeCost = body.IncludeCost
                    },
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.IntegrationHostedAzureExtractorConfigured,
                ActorUserId = actorId,
                ActorUserName = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        record.SubscriptionId,
                        record.CustomerTenantId,
                        record.CustomerAppId,
                        record.IncludeCost
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(ToResponse(record));
    }

    [HttpGet("configuration")]
    [MutatingAuditExcluded("Read-only hosted extractor configuration lookup.")]
    [ProducesResponseType(typeof(HostedAzureExtractorConfigurationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConfigurationAsync(
        [FromQuery] string subscriptionId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(subscriptionId))
            return this.BadRequestProblem("subscriptionId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        TenantHostedExtractorConfigurationRecord? record = await _configurationRepository
            .TryGetAsync(scope.TenantId, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (record is null)
            return NotFound();

        return Ok(ToResponse(record));
    }

    private static HostedAzureExtractorConfigurationResponse ToResponse(
        TenantHostedExtractorConfigurationRecord record) =>
        new()
        {
            CustomerTenantId = record.CustomerTenantId,
            CustomerAppId = record.CustomerAppId,
            SubscriptionId = record.SubscriptionId,
            IncludeCost = record.IncludeCost,
            UpdatedUtc = record.UpdatedUtc
        };
}

public sealed class HostedAzureExtractorConfigureBody
{
    public required string CustomerTenantId { get; init; }

    public required string CustomerAppId { get; init; }

    public required string SubscriptionId { get; init; }

    public bool IncludeCost { get; init; }
}

public sealed class HostedAzureExtractorConfigurationResponse
{
    public required string CustomerTenantId { get; init; }

    public required string CustomerAppId { get; init; }

    public required string SubscriptionId { get; init; }

    public bool IncludeCost { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}
