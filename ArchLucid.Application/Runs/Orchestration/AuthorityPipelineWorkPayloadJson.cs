using System.Text.Json;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Shared JSON options for <see cref="AuthorityPipelineWorkPayload" /> serialization.</summary>
public static class AuthorityPipelineWorkPayloadJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(AuthorityPipelineWorkPayload payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        return JsonSerializer.Serialize(payload, Options);
    }

    public static AuthorityPipelineWorkPayload? Deserialize(string json)
    {
        return TryDeserialize(json, out AuthorityPipelineWorkPayload? payload)
            ? payload
            : null;
    }

    public static bool TryDeserialize(string json, out AuthorityPipelineWorkPayload? payload)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            payload = null;

            return false;
        }

        try
        {
            payload = JsonSerializer.Deserialize<AuthorityPipelineWorkPayload>(json, Options);

            if (payload is not null)
                payload.EnsureMutableCollections();

            return payload is not null;
        }
        catch (JsonException)
        {
            payload = null;

            return false;
        }
    }
}
