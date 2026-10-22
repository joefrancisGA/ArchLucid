using ArchLucid.Application.Integrations;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Notifications.Teams;
using ArchLucid.Core.Secrets;
using ArchLucid.Notifications;

using Azure;

namespace ArchLucid.Host.Composition.Services;

/// <summary>Validates Key Vault secret references and sends synthetic Teams test notifications.</summary>
public sealed class TeamsIncomingWebhookConnectionProbeService(
    ISecretProvider secretProvider,
    IChatOpsWebhookDeliveryService chatOpsDelivery) : ITeamsIncomingWebhookConnectionProbeService
{
    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly IChatOpsWebhookDeliveryService _chatOpsDelivery =
        chatOpsDelivery ?? throw new ArgumentNullException(nameof(chatOpsDelivery));

    public async Task<TeamsIncomingWebhookSecretValidationResponse> ValidateSecretAsync(
        string? keyVaultSecretName,
        CancellationToken cancellationToken = default)
    {
        if (!TeamsIncomingWebhookConnectionUpsertValidation.TryValidateKeyVaultSecretName(
                keyVaultSecretName,
                out string? trimmed,
                out _))
        {
            return new TeamsIncomingWebhookSecretValidationResponse
            {
                Outcome = TeamsIncomingWebhookSecretValidationOutcome.InvalidName,
                Message = "Enter a Key Vault secret name, not a webhook URL.",
            };
        }

        string? secretValue;

        try
        {
            secretValue = await _secretProvider.GetSecretAsync(trimmed!, cancellationToken);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return NotFound();
        }
        catch (RequestFailedException ex) when (ex.Status == 403)
        {
            return PermissionDenied();
        }
        catch (RequestFailedException)
        {
            return PermissionDenied();
        }

        if (string.IsNullOrWhiteSpace(secretValue))
        {
            return NotFound();
        }

        if (!LooksLikeTeamsWebhookUrl(secretValue))
        {
            return new TeamsIncomingWebhookSecretValidationResponse
            {
                Outcome = TeamsIncomingWebhookSecretValidationOutcome.InvalidValue,
                Message = "The secret was found, but it does not contain a valid Teams webhook URL.",
            };
        }

        return new TeamsIncomingWebhookSecretValidationResponse
        {
            Outcome = TeamsIncomingWebhookSecretValidationOutcome.Found,
            Message = "Secret found and accessible.",
        };
    }

    public async Task<TeamsIncomingWebhookConnectionTestResponse> SendTestAsync(
        string? keyVaultSecretName,
        CancellationToken cancellationToken = default)
    {
        TeamsIncomingWebhookSecretValidationResponse validation =
            await ValidateSecretAsync(keyVaultSecretName, cancellationToken);

        if (validation.Outcome != TeamsIncomingWebhookSecretValidationOutcome.Found)
        {
            return new TeamsIncomingWebhookConnectionTestResponse
            {
                Delivered = false,
                Message =
                    "We could not deliver the test notification. Check the webhook, Key Vault access, and Teams connector status.",
            };
        }

        if (!TeamsIncomingWebhookConnectionUpsertValidation.TryValidateKeyVaultSecretName(
                keyVaultSecretName,
                out string? trimmed,
                out _))
        {
            return Failed();
        }

        string? secretValue = await _secretProvider.GetSecretAsync(trimmed!, cancellationToken);

        if (string.IsNullOrWhiteSpace(secretValue) || !LooksLikeTeamsWebhookUrl(secretValue))
        {
            return Failed();
        }

        ChatOpsWebhookMessage message = new()
        {
            SeverityLabel = "Info",
            Title = "ArchLucid test notification",
            SupportingParagraph = "This is a test message from ArchLucid. No review, alert, or governance event was created.",
            Body = "If you received this message, your Microsoft Teams connection is configured correctly.",
        };

        try
        {
            await _chatOpsDelivery.DeliverAsync(
                ChatOpsWebhookTarget.Teams,
                secretValue.Trim(),
                message,
                cancellationToken);

            return new TeamsIncomingWebhookConnectionTestResponse
            {
                Delivered = true,
                Message = "Test notification sent to Microsoft Teams.",
            };
        }
        catch
        {
            return Failed();
        }
    }

    private static TeamsIncomingWebhookSecretValidationResponse NotFound() =>
        new()
        {
            Outcome = TeamsIncomingWebhookSecretValidationOutcome.NotFound,
            Message = "We could not find a secret with that name.",
        };

    private static TeamsIncomingWebhookSecretValidationResponse PermissionDenied() =>
        new()
        {
            Outcome = TeamsIncomingWebhookSecretValidationOutcome.PermissionDenied,
            Message = "ArchLucid cannot access this secret. Check the workspace’s Key Vault permissions.",
        };

    private static TeamsIncomingWebhookConnectionTestResponse Failed() =>
        new()
        {
            Delivered = false,
            Message =
                "We could not deliver the test notification. Check the webhook, Key Vault access, and Teams connector status.",
        };

    internal static bool LooksLikeTeamsWebhookUrl(string value)
    {
        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out Uri? uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string host = uri.Host;

        return host.Contains("webhook.office.com", StringComparison.OrdinalIgnoreCase)
            || host.Contains("office.com", StringComparison.OrdinalIgnoreCase);
    }
}
