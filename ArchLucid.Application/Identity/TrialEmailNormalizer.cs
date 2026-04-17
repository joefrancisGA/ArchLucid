namespace ArchLucid.Application.Identity;

public static class TrialEmailNormalizer
{
    public static string Normalize(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        return email.Trim().ToUpperInvariant();
    }
}
