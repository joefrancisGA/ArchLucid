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
            Ou = UtcCursorDateTimeCodec.FormatRoundTripUtc(occurredUtc),
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

        if (!UtcCursorDateTimeCodec.TryParseRoundTripUtc(dto.Ou, out DateTime occurredUtc))
            return null;

        return (occurredUtc, dto.Ei);
    }

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
