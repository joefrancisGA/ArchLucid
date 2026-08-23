using System.Text.Json;

using ArchLucid.Core.Codecs;

namespace ArchLucid.Core.Pagination;

/// <summary>Opaque cursors for findings keyset pagination (<c>SortOrder ASC, FindingRecordId ASC</c>).</summary>
public static class FindingCursorCodec
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Encodes the cursor after the last item on the previous page.</summary>
    public static string Encode(int sortOrder, Guid findingRecordId)
    {
        FindingListCursorDto dto = new()
        {
            So = sortOrder,
            Fri = findingRecordId
        };
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(dto, SerializerOptions);
        return Base64UrlCodec.Encode(utf8);
    }

    public static (int SortOrder, Guid FindingRecordId)? TryDecode(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
            return null;

        if (!Base64UrlCodec.TryDecode(encoded, out byte[] bytes))
            return null;

        FindingListCursorDto? dto = JsonSerializer.Deserialize<FindingListCursorDto>(bytes, SerializerOptions);

        if (dto is null || dto.Fri == Guid.Empty)
            return null;

        return (dto.So, dto.Fri);
    }

    private sealed class FindingListCursorDto
    {
        public int So
        {
            get;
            init;
        }

        public Guid Fri
        {
            get;
            init;
        }
    }
}
