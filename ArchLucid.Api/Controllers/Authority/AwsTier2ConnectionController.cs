using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Endpoints for Tier 2 continuous AWS ingestion setup (IAM role ARN + OIDC federation).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/aws-extractor/connections")]
public sealed class AwsTier2ConnectionController(
    IAwsTier2ConnectionService connectionService,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly IAwsTier2ConnectionService _connectionService =
        connectionService ?? throw new ArgumentNullException(nameof(connectionService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [ProducesResponseType(typeof(AwsTier2ConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfigureAsync(
        [FromBody] AwsTier2ConnectionConfigureBody body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        AwsTier2ConnectionSummary record;

        try
        {
            record = await _connectionService
                .ConfigureAsync(
                    scope.TenantId,
                    actorId,
                    new AwsTier2ConnectionConfigureRequest
                    {
                        AccountId = body.AccountId,
                        Region = body.Region,
                        RoleArn = body.RoleArn
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
                EventType = AuditEventTypes.CloudConnectionAwsConnected,
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
                        record.AccountId,
                        record.Region,
                        record.RoleArn
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(ToResponse(record));
    }

    // Deliberately inherits the class-level ExecuteAuthority policy (not lowered to ReadAuthority): cloud connection
    // metadata (account IDs, role ARNs) is Execute-tier-and-above only, matching the nav gate on Cloud connections.
    [HttpGet]
    [MutatingAuditExcluded("Read-only connection lookup.")]
    [ProducesResponseType(typeof(IReadOnlyList<AwsTier2ConnectionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListConnectionsAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<AwsTier2ConnectionSummary> records = await _connectionService
            .ListConnectionsAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        return Ok(records.Select(ToResponse).ToList());
    }

    [HttpDelete("{connectionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DisconnectAsync(Guid connectionId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        await _connectionService
            .DisconnectAsync(scope.TenantId, connectionId, actorId, cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudConnectionAwsDisconnected,
                ActorUserId = actorId,
                ActorUserName = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new { connectionId },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return NoContent();
    }

    private static AwsTier2ConnectionResponse ToResponse(AwsTier2ConnectionSummary record) =>
        new()
        {
            ConnectionId = record.ConnectionId,
            AccountId = record.AccountId,
            Region = record.Region,
            RoleArn = record.RoleArn,
            Status = record.Status.ToString(),
            LastPolledUtc = record.LastPolledUtc,
            UpdatedUtc = record.UpdatedUtc
        };
}

