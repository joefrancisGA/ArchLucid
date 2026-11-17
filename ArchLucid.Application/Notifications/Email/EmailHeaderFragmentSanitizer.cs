namespace ArchLucid.Application.Notifications.Email;

/// <summary>Sanitizes untrusted fragments embedded in SMTP subject lines.</summary>
public static class EmailHeaderFragmentSanitizer
{
    public static string Sanitize(string value) => Core.Notifications.EmailHeaderFragmentSanitizer.Sanitize(value);
}