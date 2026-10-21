using ArchLucid.Core.Security;

namespace ArchLucid.Notifications;

/// <summary>Validates configured ChatOps incoming webhook absolute URIs before outbound POST.</summary>
public static class ChatOpsWebhookAbsoluteUriValidator
{
    public static bool TryValidateHttpsAbsoluteUri(string? rawUri, out string deliveryUri)
    {
        deliveryUri = string.Empty;

        if (string.IsNullOrWhiteSpace(rawUri))
        {
            return false;
        }

        string trimmed = rawUri.Trim();

        if (WebhookHttpsUriLineBreakGuard.ContainsForbiddenLineBreakMaterial(trimmed))
        {
            return false;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri) || uri.Scheme != Uri.UriSchemeHttps)
        {
            return false;
        }

        deliveryUri = uri.ToString();

        return true;
    }

    public static string ResolveHttpsDeliveryUriOrThrow(string? rawUri, string paramName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawUri, paramName);

        if (!TryValidateHttpsAbsoluteUri(rawUri, out string deliveryUri))
        {
            throw new ArgumentException("Webhook destination is not a valid HTTPS absolute URI.", paramName);
        }

        return deliveryUri;
    }
}
