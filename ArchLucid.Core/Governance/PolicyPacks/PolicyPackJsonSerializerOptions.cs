using System.Text.Json;

namespace ArchLucid.Core.Governance.PolicyPacks;

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
        AllowTrailingCommas = true
    };
}
