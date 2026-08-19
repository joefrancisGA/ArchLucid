using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Http;

/// <summary>
///     Shared strong-ETag derivation and <c>If-None-Match</c> negotiation for tenant-scoped operator reads.
/// </summary>
/// <remarks>
///     Row-version tags mirror the hot-path cache suffix (<c>hex(RowVersion)</c> per <c>PERFORMANCE.md</c>).
///     List and audit pages fall back to stable SHA-256 fingerprints when no single row version applies.
/// </remarks>
public static class ConditionalGetNegotiation
{
    /// <summary>Validator-only posture for private tenant data (no shared cache).</summary>
    public const string PrivateNoStoreCacheControl = "private, no-store";

    /// <summary>Wraps a lowercase hex digest in RFC 9110 strong-ETag quotes.</summary>
    public static string QuoteStrongEtagHex(string lowerHexDigest) => $"\"{lowerHexDigest}\"";

    /// <summary>Wraps a SHA-256 digest in RFC 9110 strong-ETag quotes.</summary>
    public static string QuoteStrongEtag(ReadOnlySpan<byte> sha256Digest) =>
        QuoteStrongEtagHex(Convert.ToHexString(sha256Digest).ToLowerInvariant());

    /// <summary>Derives a strong ETag from a SQL <c>ROWVERSION</c> stamp when present.</summary>
    public static bool TryFromRowVersion(byte[]? rowVersion, out string etag)
    {
        if (rowVersion is { Length: > 0 })
        {
            etag = QuoteStrongEtagHex(Convert.ToHexString(rowVersion).ToLowerInvariant());
            return true;
        }

        etag = string.Empty;
        return false;
    }

    /// <summary>Combines a row version with a request fingerprint (pagination, filters, snapshot id).</summary>
    public static string FromRowVersionWithFingerprint(byte[]? rowVersion, string requestFingerprint)
    {
        using IncrementalHash hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        AppendUtf8(hash, requestFingerprint);

        if (rowVersion is { Length: > 0 })
            hash.AppendData(rowVersion);
        else
            hash.AppendData([0]);

        return QuoteStrongEtag(hash.GetHashAndReset());
    }

    /// <summary>Stable validator for a run list page keyed by each row's <see cref="RunRecord.RowVersion" />.</summary>
    public static string ComputeRunListEtag(IReadOnlyList<RunSummaryRowVersionSlice> rows, string requestFingerprint)
    {
        ArgumentNullException.ThrowIfNull(rows);

        using IncrementalHash hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        AppendUtf8(hash, requestFingerprint);
        Span<byte> lengthBuffer = stackalloc byte[4];

        BinaryPrimitives.WriteInt32BigEndian(lengthBuffer, rows.Count);
        hash.AppendData(lengthBuffer);

        foreach (RunSummaryRowVersionSlice row in rows)
        {
            AppendGuid(hash, row.RunId);

            if (row.RowVersion is { Length: > 0 })
                hash.AppendData(row.RowVersion);
            else
                hash.AppendData([0]);
        }

        return QuoteStrongEtag(hash.GetHashAndReset());
    }

    /// <summary>Stable validator for a newest-first audit page.</summary>
    public static string ComputeAuditPageEtag(IReadOnlyList<AuditEvent> events, string requestFingerprint)
    {
        ArgumentNullException.ThrowIfNull(events);

        using IncrementalHash hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        AppendUtf8(hash, requestFingerprint);
        Span<byte> lengthBuffer = stackalloc byte[4];

        BinaryPrimitives.WriteInt32BigEndian(lengthBuffer, events.Count);
        hash.AppendData(lengthBuffer);

        if (events.Count > 0)
        {
            AuditEvent head = events[0];
            AuditEvent tail = events[^1];
            AppendGuid(hash, head.EventId);
            AppendUtcTicks(hash, head.OccurredUtc);
            AppendGuid(hash, tail.EventId);
            AppendUtcTicks(hash, tail.OccurredUtc);
        }

        return QuoteStrongEtag(hash.GetHashAndReset());
    }

    /// <summary>Stable strong ETag from a UTF-8 payload (typically canonical JSON).</summary>
    public static string ComputeSha256EtagFromUtf8(string payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return QuoteStrongEtag(hash);
    }

    /// <summary>Serializes <paramref name="value" /> and derives a stable strong ETag.</summary>
    public static string ComputeJsonResponseEtag<T>(T value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string json = JsonSerializer.Serialize(value, options);

        return ComputeSha256EtagFromUtf8(json);
    }

    /// <summary>Serializes <paramref name="value" /> with a request fingerprint for stable list/filter ETags.</summary>
    public static string ComputeJsonResponseEtag<T>(T value, JsonSerializerOptions options, string requestFingerprint)
    {
        ArgumentNullException.ThrowIfNull(options);

        string json = JsonSerializer.Serialize(value, options);

        return ComputeSha256EtagFromUtf8($"{requestFingerprint}|{json}");
    }

    /// <summary>Returns <see langword="true" /> when any supplied <c>If-None-Match</c> value matches <paramref name="etag" />.</summary>
    public static bool TryMatchIfNoneMatch(IList<string?>? ifNoneMatchValues, string etag)
    {
        if (ifNoneMatchValues is null || ifNoneMatchValues.Count == 0 || string.IsNullOrEmpty(etag))
            return false;

        foreach (string? raw in ifNoneMatchValues)
        {
            if (string.IsNullOrWhiteSpace(raw))
                continue;

            if (raw == "*")
                return true;

            foreach (string token in raw.Split(','))
            {
                string trimmed = token.Trim();

                if (trimmed.StartsWith("W/", StringComparison.Ordinal))
                    trimmed = trimmed[2..].Trim();

                if (string.Equals(trimmed, etag, StringComparison.Ordinal))
                    return true;
            }
        }

        return false;
    }

    private static void AppendUtf8(IncrementalHash hash, string value)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(value);
        Span<byte> lengthBuffer = stackalloc byte[4];
        BinaryPrimitives.WriteInt32BigEndian(lengthBuffer, bytes.Length);
        hash.AppendData(lengthBuffer);
        hash.AppendData(bytes);
    }

    private static void AppendGuid(IncrementalHash hash, Guid value)
    {
        hash.AppendData(value.ToByteArray());
    }

    private static void AppendUtcTicks(IncrementalHash hash, DateTime utc)
    {
        Span<byte> buffer = stackalloc byte[8];
        BinaryPrimitives.WriteInt64BigEndian(buffer, utc.Ticks);
        hash.AppendData(buffer);
    }
}

/// <summary>Row-version slice used when deriving list ETags without exposing stamps on API DTOs.</summary>
public readonly record struct RunSummaryRowVersionSlice(Guid RunId, byte[]? RowVersion);
