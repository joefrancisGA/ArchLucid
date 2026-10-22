namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Masks deployment credential identifiers for admin onboarding (never expose secrets).</summary>
public static class TenantItsmCredentialMasking
{
    public static string? MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        string trimmed = email.Trim();
        int at = trimmed.IndexOf('@');

        if (at <= 0 || at >= trimmed.Length - 1)
            return "***";

        string local = trimmed[..at];
        string domain = trimmed[(at + 1)..];
        string maskedLocal = local.Length <= 2 ? "***" : $"{local[0]}***{local[^1]}";

        return $"{maskedLocal}@{domain}";
    }

    public static string? MaskUsername(string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return null;

        string trimmed = username.Trim();

        if (trimmed.Length <= 2)
            return "***";

        return $"{trimmed[0]}***{trimmed[^1]}";
    }
}
