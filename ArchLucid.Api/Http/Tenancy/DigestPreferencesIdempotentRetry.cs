namespace ArchLucid.Api.Http.Tenancy;

using ArchLucid.Contracts.User;

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
            || !IanaTimeZoneIdsMatch(existingIanaTimeZoneId, requestedIanaTimeZoneId))
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

    private static bool IanaTimeZoneIdsMatch(string? existing, string? requested)
    {
        string normalizedExisting = IanaTimeZonePreferenceValues.NormalizeOrDefault(existing);
        string normalizedRequested = IanaTimeZonePreferenceValues.NormalizeOrDefault(requested);

        return string.Equals(normalizedExisting, normalizedRequested, StringComparison.OrdinalIgnoreCase);
    }
}
