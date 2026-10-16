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

        if (ContainsEmbeddedLineBreaks(trimmed) || ContainsPercentEncodedLineBreaks(trimmed))
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

    private static bool ContainsEmbeddedLineBreaks(string value)
    {

        foreach (char character in value)
        {

            if (character is '\r' or '\n' or '\u0085' or '\u2028' or '\u2029')
            {
                return true;
            }
        }

        return false;
    }

    private static bool ContainsPercentEncodedLineBreaks(string value)
    {
        return value.Contains("%0D", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%0A", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%E2%80%A8", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%E2%80%A9", StringComparison.OrdinalIgnoreCase)
            || value.Contains("%C2%85", StringComparison.OrdinalIgnoreCase);
    }
}
