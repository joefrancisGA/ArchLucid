using System.Text.Json;

using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Operator-registered ITSM ticket ↔ finding correlation for inbound webhooks.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/correlations")]
[EnableRateLimiting("fixed")]
public sealed class ItsmCorrelationController(
    IScopeContextProvider scope,
    IItsmFindingCorrelationRepository correlations,
    ItsmFindingCorrelationQueryService correlationQuery,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scope = scope ?? throw new ArgumentNullException(nameof(scope));

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly ItsmFindingCorrelationQueryService _correlationQuery =
        correlationQuery ?? throw new ArgumentNullException(nameof(correlationQuery));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Lists ITSM ticket correlations for a finding in the current tenant scope (TB-063).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ItsmFindingCorrelationsByFindingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListByFinding([FromQuery] string findingId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        ScopeContext ctx = _scope.GetCurrentScope();

        ItsmFindingCorrelationsByFindingResponse body =
            await _correlationQuery.ListForFindingAsync(ctx, findingId, ct).ConfigureAwait(false);

        return Ok(body);
    }

    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterCorrelation(
        [FromBody] RegisterItsmCorrelationRequest body,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.FindingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(body.Provider))
            return this.BadRequestProblem("provider is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(body.ExternalKey))
            return this.BadRequestProblem("externalKey is required.", ProblemTypes.ValidationFailed);

        string provider = body.Provider.Trim();

        if (!provider.Equals("Jira", StringComparison.OrdinalIgnoreCase) &&
            !provider.Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))

            return this.BadRequestProblem("provider must be Jira or ServiceNow.", ProblemTypes.ValidationFailed);

        provider = provider.Equals("Jira", StringComparison.OrdinalIgnoreCase) ? "Jira" : "ServiceNow";

        ScopeContext ctx = _scope.GetCurrentScope();

        await _correlations.RegisterAsync(
                ctx.TenantId,
                ctx.WorkspaceId,
                ctx.ProjectId,
                body.FindingId,
                provider,
                body.ExternalKey,
                body.ExternalSysId,
                ct)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.IntegrationItsmFindingCorrelationRegistered,
                TenantId = ctx.TenantId,
                WorkspaceId = ctx.WorkspaceId,
                ProjectId = ctx.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = body.FindingId,
                    provider,
                    externalKey = body.ExternalKey,
                    externalSysId = body.ExternalSysId
                })
            },
            ct);

        return NoContent();
    }
}
