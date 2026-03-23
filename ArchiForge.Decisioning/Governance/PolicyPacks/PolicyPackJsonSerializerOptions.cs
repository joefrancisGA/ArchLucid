using System.Text.Json;

namespace ArchiForge.Decisioning.Governance.PolicyPacks;

/// <summary>
/// Shared options for serializing/deserializing <see cref="PolicyPackContentDocument"/> and pack <c>ContentJson</c> payloads.
/// </summary>
public static class PolicyPackJsonSerializerOptions
{
    public static JsonSerializerOptions Default
    {
        get;
    } = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };
}
