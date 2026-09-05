namespace ArchLucid.Api.Http.Tenancy;

/// <summary>Detects operator-documented-safe-retry no-op upserts for digest preference POST endpoints.</summary>
internal static class DigestPreferencesIdempotentRetry
{
    public static bool MatchesExisting(
        bool isConfigured,
        bool existingEmailEnabled,
        IReadOnlyList<string> existingRecipientEmails,
        string existingIanaTimeZoneId,
        int existingDayOfWeek,
        int existingHourOfDay,
        bool requestedEmailEnabled,
        IReadOnlyList<string> requestedRecipientEmails,
        string requestedIanaTimeZoneId,
        int requestedDayOfWeek,
        int requestedHourOfDay)
    {
        if (!isConfigured)
            return false;

        if (existingEmailEnabled != requestedEmailEnabled
            || existingDayOfWeek != requestedDayOfWeek
            || existingHourOfDay != requestedHourOfDay
            || !string.Equals(existingIanaTimeZoneId, requestedIanaTimeZoneId, StringComparison.Ordinal))
        {
            return false;
        }

        if (existingRecipientEmails.Count != requestedRecipientEmails.Count)
            return false;

        for (int index = 0; index < existingRecipientEmails.Count; index++)
        {
            if (!string.Equals(
                    existingRecipientEmails[index],
                    requestedRecipientEmails[index],
                    StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }
}
