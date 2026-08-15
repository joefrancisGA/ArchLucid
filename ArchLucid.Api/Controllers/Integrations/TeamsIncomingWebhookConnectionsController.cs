using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Notifications.Teams;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Per-tenant Microsoft Teams notification connector configuration (Key Vault secret name only).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/teams")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TeamsIncomingWebhookConnectionsController(
    IScopeContextProvider scopeProvider,
    ITenantTeamsIncomingWebhookConnectionRepository connectionRepository,
    IAuditService auditService,
    ITeamsIncomingWebhookConnectionProbeService probeService) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITeamsIncomingWebhookConnectionProbeService _probeService =
        probeService ?? throw new ArgumentNullException(nameof(probeService));

    private readonly ITenantTeamsIncomingWebhookConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Returns the Key Vault reference (never the webhook URL) for the caller's tenant.</summary>
    [HttpGet("connections")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TeamsIncomingWebhookConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetConnection(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TeamsIncomingWebhookConnectionResponse connection =
            await LoadConnectionAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(connection);
    }

    /// <summary>Returns the canonical v1 catalog of Teams notification triggers an operator can opt in to.</summary>
    [HttpGet("triggers")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult GetTriggerCatalog()
    {
        return Ok(TeamsNotificationTriggerCatalog.All);
    }

    /// <summary>Teams notifications page bundle: connection row and trigger catalog.</summary>
    [HttpGet("page-bundle")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TeamsIncomingWebhookPageBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPageBundle(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TeamsIncomingWebhookConnectionResponse connection =
            await LoadConnectionAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        TeamsIncomingWebhookPageBundleResponse body = new()
        {
            Connection = connection,
            TriggerCatalog = TeamsNotificationTriggerCatalog.All
        };

        return Ok(body);
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

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TeamsIncomingWebhookConnectionResponse? saved = await _connectionRepository.UpsertAsync(
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

        await _auditService.LogAsync(
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
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        bool removed = await _connectionRepository.DeleteAsync(scope.TenantId, cancellationToken);

        if (removed)
        {
            await _auditService.LogAsync(
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

    /// <summary>Validates that a Key Vault secret exists, is accessible, and contains a Teams webhook URL.</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("connections/validate-secret")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: read-only Key Vault probe; no connection persisted.")]
    [ProducesResponseType(typeof(TeamsIncomingWebhookSecretValidationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateSecret(
        [FromBody] TeamsIncomingWebhookSecretValidationRequest? body,
        CancellationToken cancellationToken)
    {
        TeamsIncomingWebhookSecretValidationResponse result =
            await _probeService.ValidateSecretAsync(body?.KeyVaultSecretName, cancellationToken);

        return Ok(result);
    }

    /// <summary>Sends a synthetic Teams test notification using a Key Vault secret reference.</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("connections/test")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: synthetic Teams probe; no governance event created.")]
    [ProducesResponseType(typeof(TeamsIncomingWebhookConnectionTestResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestConnection(
        [FromBody] TeamsIncomingWebhookConnectionTestRequest? body,
        CancellationToken cancellationToken)
    {
        string? secretName = body?.KeyVaultSecretName;

        if (string.IsNullOrWhiteSpace(secretName))
        {
            ScopeContext scope = _scopeProvider.GetCurrentScope();
            TeamsIncomingWebhookConnectionResponse? row =
                await _connectionRepository.GetAsync(scope.TenantId, cancellationToken);
            secretName = row?.KeyVaultSecretName;
        }

        TeamsIncomingWebhookConnectionTestResponse result =
            await _probeService.SendTestAsync(secretName, cancellationToken);

        return Ok(result);
    }

    private async Task<TeamsIncomingWebhookConnectionResponse> LoadConnectionAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TeamsIncomingWebhookConnectionResponse? row =
            await _connectionRepository.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

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
