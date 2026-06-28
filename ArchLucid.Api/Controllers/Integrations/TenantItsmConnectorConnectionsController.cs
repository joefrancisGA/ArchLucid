using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Per-tenant Jira / ServiceNow connector credential references (Key Vault secret names only — TB-392).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/connections")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantItsmConnectorConnectionsController(
    IScopeContextProvider scopeProvider,
    ITenantItsmConnectorConnectionRepository connectionRepository,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantItsmConnectorConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantItsmConnectorConnectionsListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListConnections(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<TenantItsmConnectorConnectionRecord> rows =
            await _connectionRepository.ListAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        Dictionary<TenantItsmConnectorProvider, TenantItsmConnectorConnectionRecord> byProvider =
            rows.ToDictionary(r => r.Provider);

        List<TenantItsmConnectorConnectionResponse> connections =
        [
            byProvider.TryGetValue(TenantItsmConnectorProvider.Jira, out TenantItsmConnectorConnectionRecord? jira)
                ? TenantItsmConnectorConnectionMapper.ToResponse(jira)
                : TenantItsmConnectorConnectionMapper.Empty(scope.TenantId, TenantItsmConnectorProvider.Jira),
            byProvider.TryGetValue(TenantItsmConnectorProvider.ServiceNow, out TenantItsmConnectorConnectionRecord? snow)
                ? TenantItsmConnectorConnectionMapper.ToResponse(snow)
                : TenantItsmConnectorConnectionMapper.Empty(scope.TenantId, TenantItsmConnectorProvider.ServiceNow)
        ];

        return Ok(new TenantItsmConnectorConnectionsListResponse { Connections = connections });
    }

    [HttpGet("{provider}")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantItsmConnectorConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetConnection(string provider, CancellationToken cancellationToken)
    {
        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(provider, out TenantItsmConnectorProvider parsed, out string? parseError))
            return this.BadRequestProblem(parseError!, ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantItsmConnectorConnectionRecord? row =
            await _connectionRepository.GetAsync(scope.TenantId, parsed, cancellationToken).ConfigureAwait(false);

        return Ok(row is null
            ? TenantItsmConnectorConnectionMapper.Empty(scope.TenantId, parsed)
            : TenantItsmConnectorConnectionMapper.ToResponse(row));
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{provider}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TenantItsmConnectorConnectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpsertConnection(
        string provider,
        [FromBody] TenantItsmConnectorConnectionUpsertRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(provider, out TenantItsmConnectorProvider parsed, out string? parseError))
            return this.BadRequestProblem(parseError!, ProblemTypes.ValidationFailed);

        if (!TenantItsmConnectorConnectionUpsertValidation.TryValidateInstanceBaseUrl(body.InstanceBaseUrl, out string? instanceBaseUrl, out string? urlError))
            return this.BadRequestProblem(urlError!, ProblemTypes.ValidationFailed);

        if (!TenantItsmConnectorConnectionUpsertValidation.TryValidateAuthUserName(body.AuthUserName, out string? authUserName, out string? userError))
            return this.BadRequestProblem(userError!, ProblemTypes.ValidationFailed);

        if (!TenantItsmConnectorConnectionUpsertValidation.TryValidateCredentialKeyVaultSecretName(
                body.CredentialKeyVaultSecretName,
                out string? credentialSecretName,
                out string? credentialError))
        {
            return this.BadRequestProblem(credentialError!, ProblemTypes.ValidationFailed);
        }

        if (!TenantItsmConnectorConnectionUpsertValidation.TryValidateInboundWebhookKeyVaultSecretName(
                body.InboundWebhookKeyVaultSecretName,
                out string? inboundSecretName,
                out string? inboundError))
        {
            return this.BadRequestProblem(inboundError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        TenantItsmConnectorConnectionRecord? saved = await _connectionRepository.UpsertAsync(
            scope.TenantId,
            parsed,
            instanceBaseUrl!,
            authUserName!,
            credentialSecretName!,
            inboundSecretName,
            body.IsEnabled,
            string.IsNullOrWhiteSpace(body.Label) ? null : body.Label.Trim(),
            cancellationToken).ConfigureAwait(false);

        if (saved is null)
        {
            return this.NotFoundProblem(
                "ITSM connector connection could not be persisted for this tenant.",
                ProblemTypes.ResourceNotFound);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantItsmConnectorConnectionUpserted,
                ActorUserId = User.Identity?.Name ?? "operator",
                ActorUserName = User.Identity?.Name ?? "operator",
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(new
                {
                    provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderLabel(parsed),
                    credentialKeyVaultSecretNameLength = credentialSecretName!.Length,
                    hasInboundWebhookSecretName = inboundSecretName is not null,
                    isEnabled = body.IsEnabled
                })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(TenantItsmConnectorConnectionMapper.ToResponse(saved));
    }

    [HttpDelete("{provider}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteConnection(string provider, CancellationToken cancellationToken)
    {
        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(provider, out TenantItsmConnectorProvider parsed, out string? parseError))
            return this.BadRequestProblem(parseError!, ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        bool removed = await _connectionRepository.DeleteAsync(scope.TenantId, parsed, cancellationToken).ConfigureAwait(false);

        if (removed)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TenantItsmConnectorConnectionRemoved,
                    ActorUserId = User.Identity?.Name ?? "operator",
                    ActorUserName = User.Identity?.Name ?? "operator",
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderLabel(parsed)
                    })
                },
                cancellationToken).ConfigureAwait(false);
        }

        return NoContent();
    }
}
