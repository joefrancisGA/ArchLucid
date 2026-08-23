using System.Text.Json;

namespace ArchLucid.Core.Pagination;

/// <summary>Opaque cursors for artifact metadata rows (<c>SortOrder ASC, ArtifactId ASC</c>).</summary>
public static class ArtifactCursorCodec
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static string Encode(int sortOrder, Guid artifactId)
    {
        ArtifactListCursorDto dto = new()
        {
            So = sortOrder,
            Ai = artifactId
        };
        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(dto, SerializerOptions);
        return Base64UrlCodec.Encode(utf8);
    }

    public static (int SortOrder, Guid ArtifactId)? TryDecode(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
            return null;

        if (!Base64UrlCodec.TryDecode(encoded, out byte[] bytes))
            return null;

        ArtifactListCursorDto? dto = JsonSerializer.Deserialize<ArtifactListCursorDto>(bytes, SerializerOptions);

        if (dto is null || dto.Ai == Guid.Empty)
            return null;

        return (dto.So, dto.Ai);
    }

    private sealed class ArtifactListCursorDto
    {
        public int So
        {
            get;
            init;
        }

        public Guid Ai
        {
            get;
            init;
        }
    }
}
