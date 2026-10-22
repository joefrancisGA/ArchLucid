using System.Text.Json;

using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class ItsmCorrelationController
{
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
