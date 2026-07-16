using System.Net.Mail;

namespace ArchLucid.Core.Identity;

public static class IdentityEmailNormalizer
{
    public static bool TryNormalize(string? email, out string normalizedEmail, out string displayEmail)
    {
        normalizedEmail = string.Empty;
        displayEmail = string.Empty;

        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            MailAddress parsed = new(email.Trim());

            if (string.IsNullOrWhiteSpace(parsed.Address))
            {
                return false;
            }

            displayEmail = parsed.Address.Trim();
            normalizedEmail = displayEmail.ToLowerInvariant();

            return normalizedEmail.Contains('@');
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
