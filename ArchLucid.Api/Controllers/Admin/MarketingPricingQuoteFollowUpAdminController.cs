using System.Text.Json;

using ArchLucid.Api.Models.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Operator follow-up for marketing pricing quote requests (acknowledge / close).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/marketing/pricing-quote-requests")]
public sealed class MarketingPricingQuoteFollowUpAdminController(
    IMarketingPricingQuoteRequestFollowUpRepository followUpRepository,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : ControllerBase
{
    private readonly IMarketingPricingQuoteRequestFollowUpRepository _followUpRepository =
        followUpRepository ?? throw new ArgumentNullException(nameof(followUpRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Records first human acknowledgement (clears SLA aging when combined with open status).</summary>
    [HttpPost("{id:guid}/acknowledge")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcknowledgeAsync(
        Guid id,
        [FromBody] MarketingPricingQuoteAcknowledgeRequest? body,
        CancellationToken cancellationToken)
    {
        bool updated = await _followUpRepository
            .AcknowledgeAsync(id, body?.AssignedOwner, cancellationToken)
            .ConfigureAwait(false);

        if (!updated)
            return NotFound();

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.MarketingPricingQuoteRequestAcknowledged,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new { quoteRequestId = id, assignedOwner = body?.AssignedOwner },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken).ConfigureAwait(false);

        return NoContent();
    }

    /// <summary>Closes the quote request so it no longer appears in aging triage.</summary>
    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseAsync(Guid id, CancellationToken cancellationToken)
    {
        bool updated = await _followUpRepository.CloseAsync(id, cancellationToken).ConfigureAwait(false);

        if (!updated)
            return NotFound();

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.MarketingPricingQuoteRequestClosed,
                ActorUserId = actorId,
                ActorUserName = User.Identity?.Name ?? actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new { quoteRequestId = id },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken).ConfigureAwait(false);

        return NoContent();
    }
}
