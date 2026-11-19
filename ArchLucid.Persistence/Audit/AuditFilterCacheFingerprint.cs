using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Persistence.Audit;

/// <summary>Stable fingerprint for first-page audit filter cache keys (TB-581).</summary>
internal static class AuditFilterCacheFingerprint
{
    internal static string Build(AuditEventFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);

        string[] fields =
        [
            filter.EventType ?? string.Empty,
            FormatInstant(filter.FromUtc),
            FormatInstant(filter.ToUtc),
            filter.CorrelationId ?? string.Empty,
            filter.ActorUserId ?? string.Empty,
            filter.RunId?.ToString("D") ?? string.Empty,
        ];

        return Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(fields)));
    }

    private static string FormatInstant(DateTime? instant)
    {
        if (!instant.HasValue)
            return string.Empty;

        return instant.Value.ToString("O", CultureInfo.InvariantCulture);
    }
}
