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

        if (ContainsEmbeddedLineBreaks(trimmed))
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

    private static bool ContainsEmbeddedLineBreaks(string value)
    {

        foreach (char character in value)
        {

            if (character is '\r' or '\n')
            {
                return true;
            }
        }

        return false;
    }
}
