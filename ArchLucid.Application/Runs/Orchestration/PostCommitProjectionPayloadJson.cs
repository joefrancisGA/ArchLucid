using System.Text.Json;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Shared JSON options for <see cref="PostCommitProjectionPayload" /> serialization.</summary>
public static class PostCommitProjectionPayloadJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(PostCommitProjectionPayload payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        return JsonSerializer.Serialize(payload, Options);
    }

    public static PostCommitProjectionPayload? Deserialize(string? json)
    {
        return string.IsNullOrWhiteSpace(json)
            ? null
            : JsonSerializer.Deserialize<PostCommitProjectionPayload>(json, Options);
    }
}
