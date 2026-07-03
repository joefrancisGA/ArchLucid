using System.Globalization;

using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>Stable fingerprint for first-page audit filter cache keys (TB-581).</summary>
internal static class AuditFilterCacheFingerprint
{
    internal static string Build(AuditEventFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);

        return string.Join(
            '|',
            filter.EventType ?? string.Empty,
            FormatInstant(filter.FromUtc),
            FormatInstant(filter.ToUtc),
            filter.CorrelationId ?? string.Empty,
            filter.ActorUserId ?? string.Empty,
            filter.RunId?.ToString("D") ?? string.Empty);
    }

    private static string FormatInstant(DateTime? instant)
    {
        if (!instant.HasValue)
            return string.Empty;

        return instant.Value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
    }
}
