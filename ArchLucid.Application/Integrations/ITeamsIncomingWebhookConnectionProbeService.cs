using ArchLucid.Contracts.Integrations;

namespace ArchLucid.Application.Integrations;

public interface ITeamsIncomingWebhookConnectionProbeService
{
    Task<TeamsIncomingWebhookSecretValidationResponse> ValidateSecretAsync(
        string? keyVaultSecretName,
        CancellationToken cancellationToken = default);

    Task<TeamsIncomingWebhookConnectionTestResponse> SendTestAsync(
        string? keyVaultSecretName,
        CancellationToken cancellationToken = default);
}
