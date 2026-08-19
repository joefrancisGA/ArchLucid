using System.Text.Json;

using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
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
    IActorContext actorContext,
    IItsmFindingCorrelationRepository correlations,
    ItsmFindingCorrelationQueryService correlationQuery,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scope = scope ?? throw new ArgumentNullException(nameof(scope));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly ItsmFindingCorrelationQueryService _correlationQuery =
        correlationQuery ?? throw new ArgumentNullException(nameof(correlationQuery));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private const int MaxBatchFindingIds = 100;

    /// <summary>Lists ITSM ticket correlations for multiple findings in the current tenant scope.</summary>
    [HttpGet("batch")]
    [ProducesResponseType(typeof(ItsmFindingCorrelationsBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListByFindings([FromQuery] string[] findingIds, CancellationToken ct)
    {
        if (findingIds is null || findingIds.Length == 0)
        {
            return Ok(new ItsmFindingCorrelationsBatchResponse
            {
                Findings = Array.Empty<ItsmFindingCorrelationsByFindingResponse>()
            });
        }

        if (findingIds.Length > MaxBatchFindingIds)
        {
            return this.BadRequestProblem(
                $"At most {MaxBatchFindingIds} findingIds are allowed per request.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext ctx = _scope.GetCurrentScope();

        ItsmFindingCorrelationsBatchResponse body =
            await _correlationQuery.ListForFindingsAsync(ctx, findingIds, ct).ConfigureAwait(false);

        return Ok(body);
    }

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

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterCorrelation(
        [FromBody] RegisterItsmCorrelationRequest body,
        CancellationToken ct)
    {
        IActionResult? validation = ValidateCorrelationBody(body, out string provider);

        if (validation is not null)
            return validation;

        ScopeContext ctx = _scope.GetCurrentScope();

        Guid? findingRecordId =
            await _correlations.TryResolveLatestCommittedFindingRecordIdAsync(ctx.TenantId, body.FindingId, ct)
                .ConfigureAwait(false);

        await _correlations.RegisterAsync(
                ctx.TenantId,
                ctx.WorkspaceId,
                ctx.ProjectId,
                body.FindingId,
                provider,
                body.ExternalKey,
                body.ExternalSysId,
                findingRecordId,
                ct)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildCorrelationAuditEvent(
                ctx,
                AuditEventTypes.IntegrationItsmFindingCorrelationRegistered,
                new
                {
                    findingId = body.FindingId,
                    provider,
                    externalKey = body.ExternalKey,
                    externalSysId = body.ExternalSysId
                }),
            ct);

        return NoContent();
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPatch]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateCorrelation(
        [FromBody] RegisterItsmCorrelationRequest body,
        CancellationToken ct)
    {
        IActionResult? validation = ValidateCorrelationBody(body, out string provider);

        if (validation is not null)
            return validation;

        ScopeContext ctx = _scope.GetCurrentScope();

        ItsmFindingCorrelationUpdateResult outcome = await _correlations.UpdateExternalTrackingAsync(
                ctx.TenantId,
                ctx.WorkspaceId,
                ctx.ProjectId,
                body.FindingId,
                provider,
                body.ExternalKey,
                body.ExternalSysId,
                ct)
            .ConfigureAwait(false);

        switch (outcome.Status)
        {
            case ItsmFindingCorrelationUpdateStatus.NotFound:
                return this.NotFoundProblem(
                    $"No ITSM correlation exists for finding '{body.FindingId}' and provider '{provider}'.",
                    ProblemTypes.ResourceNotFound);

            case ItsmFindingCorrelationUpdateStatus.ExternalKeyConflict:
                return this.ConflictProblem(
                    $"External key '{body.ExternalKey}' is already linked to another finding for provider '{provider}'.",
                    ProblemTypes.Conflict);

            case ItsmFindingCorrelationUpdateStatus.Unchanged:
                return NoContent();

            case ItsmFindingCorrelationUpdateStatus.Updated:
                await _auditService.LogAsync(
                    BuildCorrelationAuditEvent(
                        ctx,
                        AuditEventTypes.IntegrationItsmFindingCorrelationUpdated,
                        new
                        {
                            findingId = body.FindingId,
                            provider,
                            priorExternalKey = outcome.Prior!.ExternalKey,
                            priorExternalSysId = outcome.Prior.ExternalSysId,
                            externalKey = outcome.Current!.ExternalKey,
                            externalSysId = outcome.Current.ExternalSysId
                        }),
                    ct);

                return NoContent();

            default:
                throw new InvalidOperationException($"Unhandled correlation update status: {outcome.Status}");
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpDelete]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveCorrelation(
        [FromQuery] string findingId,
        [FromQuery] string provider,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        IActionResult? providerValidation = TryNormalizeProvider(provider, out string normalizedProvider);

        if (providerValidation is not null)
            return providerValidation;

        ScopeContext ctx = _scope.GetCurrentScope();

        ItsmFindingCorrelationRecord? removed = await _correlations.RemoveByFindingAndProviderAsync(
                ctx.TenantId,
                findingId,
                normalizedProvider,
                ct)
            .ConfigureAwait(false);

        if (removed is not null)
        {
            await _auditService.LogAsync(
                BuildCorrelationAuditEvent(
                    ctx,
                    AuditEventTypes.IntegrationItsmFindingCorrelationRemoved,
                    new
                    {
                        findingId = removed.FindingId,
                        provider = removed.Provider,
                        priorExternalKey = removed.ExternalKey,
                        priorExternalSysId = removed.ExternalSysId
                    }),
                ct);
        }

        return NoContent();
    }

    private IActionResult? ValidateCorrelationBody(RegisterItsmCorrelationRequest body, out string provider)
    {
        provider = string.Empty;

        if (string.IsNullOrWhiteSpace(body.FindingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(body.ExternalKey))
            return this.BadRequestProblem("externalKey is required.", ProblemTypes.ValidationFailed);

        IActionResult? providerValidation = TryNormalizeProvider(body.Provider, out provider);

        return providerValidation;
    }

    private IActionResult? TryNormalizeProvider(string? providerInput, out string provider)
    {
        provider = string.Empty;

        if (string.IsNullOrWhiteSpace(providerInput))
            return this.BadRequestProblem("provider is required.", ProblemTypes.ValidationFailed);

        if (!providerInput.Trim().Equals("Jira", StringComparison.OrdinalIgnoreCase) &&
            !providerInput.Trim().Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))

            return this.BadRequestProblem("provider must be Jira or ServiceNow.", ProblemTypes.ValidationFailed);

        provider = providerInput.Trim().Equals("Jira", StringComparison.OrdinalIgnoreCase) ? "Jira" : "ServiceNow";

        return null;
    }

    private AuditEvent BuildCorrelationAuditEvent(ScopeContext ctx, string eventType, object payload)
    {
        return new AuditEvent
        {
            EventType = eventType,
            ActorUserId = _actorContext.GetActorId(),
            ActorUserName = _actorContext.GetActor(),
            TenantId = ctx.TenantId,
            WorkspaceId = ctx.WorkspaceId,
            ProjectId = ctx.ProjectId,
            DataJson = JsonSerializer.Serialize(payload)
        };
    }
}
