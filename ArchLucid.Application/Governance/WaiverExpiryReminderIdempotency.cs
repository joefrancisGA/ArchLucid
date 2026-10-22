using System.Globalization;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Idempotency keys for TB-2193 waiver expiry reminders, deduplicated through <c>ISentEmailLedger</c>.
/// </summary>
public static class WaiverExpiryReminderIdempotency
{
    public const string EmailTemplateId = "risk-exception-expiry-reminder";

    /// <summary>
    ///     One key per exception, per expiry deadline, per boundary.
    ///     <para>
    ///         The expiry day is part of the key on purpose. Keyed only by exception and boundary, a renewed waiver
    ///         would be permanently silent — its new deadline would reuse a key that was already burned against the
    ///         old deadline. Including the day means a renewal starts a fresh reminder series while a process restart
    ///         still reuses the same key and stays deduplicated.
    ///     </para>
    /// </summary>
    public static string BuildKey(Guid riskExceptionId, DateTimeOffset expiresAtUtc, int boundaryDays)
    {
        if (riskExceptionId == Guid.Empty)
            throw new ArgumentException("Risk exception id is required.", nameof(riskExceptionId));

        string expiryDay = DateOnly
            .FromDateTime(expiresAtUtc.UtcDateTime)
            .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        return string.Create(
            CultureInfo.InvariantCulture,
            $"{EmailTemplateId}:{riskExceptionId:N}:{expiryDay}:{boundaryDays}");
    }
}
