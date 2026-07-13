using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Core.Pagination;

/// <summary>Opaque cursors for audit search (<c>OccurredUtc DESC, EventId DESC</c>).</summary>
public static class AuditEventCursorCodec
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static string Encode(DateTime occurredUtc, Guid eventId)
    {
        AuditListCursorDto dto = new()
        {
            Ou = FormatRoundTrip(occurredUtc),
            Ei = eventId
        };
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(dto, SerializerOptions);
        return Base64UrlCodec.Encode(utf8);
    }

    public static (DateTime OccurredUtc, Guid EventId)? TryDecode(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
            return null;

        if (!Base64UrlCodec.TryDecode(encoded, out byte[] bytes))
            return null;
        AuditListCursorDto? dto = JsonSerializer.Deserialize<AuditListCursorDto>(bytes, SerializerOptions);

        if (dto is null || string.IsNullOrWhiteSpace(dto.Ou) || dto.Ei == Guid.Empty)
            return null;

        if (!DateTime.TryParse(dto.Ou, null, DateTimeStyles.RoundtripKind, out DateTime oc))
            return null;

        return (Normalize(oc), dto.Ei);
    }

    private static string FormatRoundTrip(DateTime dt) =>
        DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("o");

    private static DateTime Normalize(DateTime dt) =>
        dt.Kind is DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt.ToUniversalTime(), DateTimeKind.Utc);

    private sealed class AuditListCursorDto
    {
        public string Ou
        {
            get;
            init;
        } = "";

        public Guid Ei
        {
            get;
            init;
        }
    }
}
