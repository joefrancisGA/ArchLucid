using System.Text.Json;

namespace ArchLucid.Core.Pagination;

/// <summary>
///     Encodes/decodes opaque run-list cursors (<see cref="RunListCursorDto" /> as Base64-url JSON).
/// </summary>
public static class RunCursorCodec
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Opaque Base64-url encoded cursor for subsequent keyset reads.</summary>
    public static string Encode(DateTime createdUtc, Guid runId)
    {
        RunListCursorDto dto = new()
        {
            Cu = UtcCursorDateTimeCodec.FormatRoundTripUtc(createdUtc),
            Ri = runId
        };
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(dto, SerializerOptions);

        return Base64UrlCodec.Encode(utf8);
    }

    /// <summary>Returns <see langword="null" /> when <paramref name="encoded" /> is null/whitespace or invalid.</summary>
    public static (DateTime CreatedUtc, Guid RunId)? TryDecode(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
            return null;

        if (!Base64UrlCodec.TryDecode(encoded, out byte[] bytes))
            return null;
        RunListCursorDto? dto =
            JsonSerializer.Deserialize<RunListCursorDto>(bytes, SerializerOptions);

        if (dto is null || string.IsNullOrWhiteSpace(dto.Cu) || dto.Ri == Guid.Empty)

            return null;

        if (!UtcCursorDateTimeCodec.TryParseRoundTripUtc(dto.Cu, out DateTime createdUtc))

            return null;

        return (createdUtc, dto.Ri);
    }

    private sealed class RunListCursorDto
    {
        public string Cu
        {
            get;
            init;
        } = "";

        public Guid Ri
        {
            get;
            init;
        }
    }
}
