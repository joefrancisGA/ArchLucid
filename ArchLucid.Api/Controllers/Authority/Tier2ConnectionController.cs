using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Endpoints for Tier 2 continuous Azure ingestion setup (Workload Identity Federation).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/azure-extractor/connections")]
public sealed class Tier2ConnectionController(
    ITier2ConnectionService connectionService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly ITier2ConnectionService _connectionService =
        connectionService ?? throw new ArgumentNullException(nameof(connectionService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost]
    [ProducesResponseType(typeof(Tier2ConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfigureAsync(
        [FromBody] Tier2ConnectionConfigureBody body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        Tier2ConnectionSummary record;

        try
        {
            record = await _connectionService
                .ConfigureAsync(
                    scope.TenantId,
                    actorId,
                    new Tier2ConnectionConfigureRequest
                    {
                        TenantIdAzure = body.TenantId,
                        ClientId = body.ClientId,
                        SubscriptionIds = body.SubscriptionIds
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
                        record.ConnectionId,
                        record.TenantIdAzure,
                        record.ClientId,
                        record.SubscriptionIds
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(ToResponse(record));
    }

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [MutatingAuditExcluded("Read-only connection lookup.")]
    [ProducesResponseType(typeof(IReadOnlyList<Tier2ConnectionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListConnectionsAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<Tier2ConnectionSummary> records = await _connectionService
            .ListConnectionsAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        return Ok(records.Select(ToResponse).ToList());
    }

    private static Tier2ConnectionResponse ToResponse(
        Tier2ConnectionSummary record) =>
        new()
        {
            ConnectionId = record.ConnectionId,
            TenantId = record.TenantIdAzure,
            ClientId = record.ClientId,
            SubscriptionIds = record.SubscriptionIds,
            UpdatedUtc = record.UpdatedUtc
        };
}

public sealed class Tier2ConnectionConfigureBody
{
    public required string TenantId { get; init; }

    public required string ClientId { get; init; }

    public required string SubscriptionIds { get; init; }
}

public sealed class Tier2ConnectionResponse
{
    public Guid ConnectionId { get; init; }

    public required string TenantId { get; init; }

    public required string ClientId { get; init; }

    public required string SubscriptionIds { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}
