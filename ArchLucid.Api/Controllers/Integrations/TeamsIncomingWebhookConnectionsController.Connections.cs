using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Notifications.Teams;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class TeamsIncomingWebhookConnectionsController
{
    /// <summary>Returns the Key Vault reference (never the webhook URL) for the caller's tenant.</summary>
    [HttpGet("connections")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TeamsIncomingWebhookConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetConnection(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        TeamsIncomingWebhookConnectionResponse connection =
            await LoadConnectionAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(connection);
    }

    /// <summary>Upserts the Key Vault secret name used to resolve the Teams incoming webhook URL at delivery time.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("connections")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TeamsIncomingWebhookConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpsertConnection(
        [FromBody] TeamsIncomingWebhookConnectionUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem(
                "Request body is required.",
                ProblemTypes.ValidationFailed);
        }

        if (!TeamsIncomingWebhookConnectionUpsertValidation.TryValidateKeyVaultSecretName(
                body.KeyVaultSecretName,
                out string? trimmed,
                out string? keyVaultError))
        {
            return this.BadRequestProblem(keyVaultError!, ProblemTypes.ValidationFailed);
        }

        string keyVaultSecretName = trimmed!;

        if (body.EnabledTriggers is not null)
        {
            IReadOnlyList<string> unknown = TeamsNotificationTriggerCatalog.Unknown(body.EnabledTriggers);

            if (unknown.Count > 0)
            {
                return this.BadRequestProblem(
                    $"EnabledTriggers contains unknown trigger names: {string.Join(", ", unknown)}. Allowed values: {string.Join(", ", TeamsNotificationTriggerCatalog.All)}.",
                    ProblemTypes.ValidationFailed);
            }
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        TeamsIncomingWebhookConnectionResponse? saved = await connectionRepository.UpsertAsync(
            scope.TenantId,
            keyVaultSecretName,
            string.IsNullOrWhiteSpace(body.Label) ? null : body.Label.Trim(),
            body.EnabledTriggers,
            cancellationToken);

        if (saved is null)
        {
            return this.NotFoundProblem(
                "Teams incoming webhook connection could not be persisted for this tenant.",
                ProblemTypes.ResourceNotFound);
        }

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantTeamsIncomingWebhookConnectionUpserted,
                ActorUserId = User.Identity?.Name ?? "operator",
                ActorUserName = User.Identity?.Name ?? "operator",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    keyVaultSecretNameLength = keyVaultSecretName.Length, enabledTriggerCount = saved.EnabledTriggers.Count
                })
            },
            cancellationToken);

        return Ok(saved);
    }

    /// <summary>Removes the Teams webhook Key Vault reference for the caller's tenant.</summary>
    [HttpDelete("connections")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteConnection(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        bool removed = await connectionRepository.DeleteAsync(scope.TenantId, cancellationToken);

        if (removed)
        {
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TenantTeamsIncomingWebhookConnectionRemoved,
                    ActorUserId = User.Identity?.Name ?? "operator",
                    ActorUserName = User.Identity?.Name ?? "operator",
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = "{}"
                },
                cancellationToken);
        }

        return NoContent();
    }

    private async Task<TeamsIncomingWebhookConnectionResponse> LoadConnectionAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TeamsIncomingWebhookConnectionResponse? row =
            await connectionRepository.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (row is not null)
            return row;

        return new TeamsIncomingWebhookConnectionResponse
        {
            TenantId = tenantId,
            IsConfigured = false,
            Label = null,
            KeyVaultSecretName = null,
            EnabledTriggers = TeamsNotificationTriggerCatalog.All,
            UpdatedUtc = TimeProvider.System.GetUtcNow()
        };
    }
}
