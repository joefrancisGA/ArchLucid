using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class TenantItsmConnectorConnectionsController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("jira/oauth/consent/start")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ItsmAtlassianOAuthConsentStartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartJiraOAuthConsent(
        [FromBody] ItsmAtlassianOAuthConsentStartRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        (ItsmAtlassianOAuthConsentStartResponse? response, string? error) =
            await _atlassianOAuthConsentService.TryStartAsync(scope.TenantId, body, cancellationToken)
                .ConfigureAwait(false);

        if (error is not null)
            return this.BadRequestProblem(error, ProblemTypes.ValidationFailed);

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
                    provider = "Jira",
                    authMode = "OAuth2RefreshToken",
                    oauthConsentStarted = true
                })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("jira/oauth/consent/complete")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ItsmAtlassianOAuthConsentCompleteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteJiraOAuthConsent(
        [FromBody] ItsmAtlassianOAuthConsentCompleteRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        (ItsmAtlassianOAuthConsentCompleteResponse? response, string? error) =
            await _atlassianOAuthConsentService.TryCompleteAsync(scope.TenantId, body, cancellationToken)
                .ConfigureAwait(false);

        if (error is not null)
            return this.BadRequestProblem(error, ProblemTypes.ValidationFailed);

        if (response?.Connection is not null)
        {
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
                        provider = "Jira",
                        authMode = "OAuth2RefreshToken",
                        oauthConsentCompleted = true,
                        credentialKeyVaultSecretNameLength = response.Connection.CredentialKeyVaultSecretName?.Length ?? 0,
                        hasOAuthClientIdSecretName = response.Connection.OAuthClientIdKeyVaultSecretName is not null,
                        hasInboundWebhookSecretName = response.Connection.InboundWebhookKeyVaultSecretName is not null,
                        isEnabled = response.Connection.IsEnabled
                    })
                },
                cancellationToken).ConfigureAwait(false);
        }

        return Ok(response);
    }
}
