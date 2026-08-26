using System.Net.Mail;
using System.Text.RegularExpressions;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Server-side validation for exec/sponsor digest recipient lists (parity with UI schedule form).
/// </summary>
public static partial class DigestRecipientEmailsValidator
{
    private static readonly Regex UnsupportedGroupMailboxPattern = UnsupportedGroupMailboxRegex();

    /// <summary>
    ///     Normalizes recipient emails and returns a validation error when the list is invalid for the requested mode.
    /// </summary>
    public static bool TryNormalize(
        IReadOnlyList<string>? rawRecipients,
        bool emailEnabled,
        out IReadOnlyList<string> normalizedRecipients,
        out string? errorMessage)
    {
        normalizedRecipients = [];
        errorMessage = null;

        List<string> trimmed = (rawRecipients ?? [])
            .Where(static e => !string.IsNullOrWhiteSpace(e))
            .Select(static e => e.Trim())
            .ToList();

        if (trimmed.Count == 0)
        {
            if (emailEnabled)
            {
                errorMessage = "At least one recipient email is required when email delivery is enabled.";
                return false;
            }

            normalizedRecipients = [];
            return true;
        }

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> normalized = [];

        foreach (string candidate in trimmed)
        {
            if (!TryParseMailbox(candidate, out string? mailbox) || mailbox is null)
            {
                errorMessage = $"Recipient email '{candidate}' is not a valid email address.";
                return false;
            }

            if (UnsupportedGroupMailboxPattern.IsMatch(mailbox))
            {
                errorMessage = $"Group mailbox '{mailbox}' is not supported as a digest recipient.";
                return false;
            }

            if (!seen.Add(mailbox))
            {
                errorMessage = $"Duplicate recipient email '{mailbox}'.";
                return false;
            }

            normalized.Add(mailbox);
        }

        normalizedRecipients = normalized;
        return true;
    }

    private static bool TryParseMailbox(string candidate, out string? mailbox)
    {
        mailbox = null;

        if (string.IsNullOrWhiteSpace(candidate))
            return false;

        try
        {
            MailAddress parsed = new(candidate.Trim());
            mailbox = parsed.Address;

            return !string.IsNullOrWhiteSpace(mailbox);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    [GeneratedRegex(@"@.*\.(onmicrosoft|google|groups)\.", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex UnsupportedGroupMailboxRegex();
}
