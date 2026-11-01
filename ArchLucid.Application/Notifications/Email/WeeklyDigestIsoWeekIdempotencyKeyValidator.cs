namespace ArchLucid.Application.Notifications.Email;

/// <summary>
/// Weekly digest dispatchers build sent-email ledger keys from caller-supplied ISO week ids.
/// Interior line breaks must not create distinct ledger scopes for the same buyer-facing week.
/// </summary>
public static class WeeklyDigestIsoWeekIdempotencyKeyValidator
{
    public static string NormalizeOrThrow(string isoWeekIdempotencyKey)
    {
        ArgumentNullException.ThrowIfNull(isoWeekIdempotencyKey);

        if (string.IsNullOrWhiteSpace(isoWeekIdempotencyKey))
        {
            throw new ArgumentException("Idempotency key is required.", nameof(isoWeekIdempotencyKey));
        }

        string trimmed = isoWeekIdempotencyKey.Trim();

        if (ContainsLineBreak(trimmed))
        {
            throw new ArgumentException("Idempotency key must not contain line breaks.", nameof(isoWeekIdempotencyKey));
        }

        return trimmed;
    }

    private static bool ContainsLineBreak(string value)
    {
        foreach (char character in value)
        {
            if (character is '\r' or '\n' or '\f' or '\u000B' or '\u0085' or '\u2028' or '\u2029')
            {
                return true;
            }
        }

        return false;
    }
}
