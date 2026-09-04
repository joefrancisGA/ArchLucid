using ArchLucid.Api.Attributes;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class TeamsIncomingWebhookConnectionsController
{
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
            await probeService.ValidateSecretAsync(body?.KeyVaultSecretName, cancellationToken);

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
            ScopeContext scope = scopeProvider.GetCurrentScope();
            TeamsIncomingWebhookConnectionResponse? row =
                await connectionRepository.GetAsync(scope.TenantId, cancellationToken);
            secretName = row?.KeyVaultSecretName;
        }

        TeamsIncomingWebhookConnectionTestResponse result =
            await probeService.SendTestAsync(secretName, cancellationToken);

        return Ok(result);
    }
}
