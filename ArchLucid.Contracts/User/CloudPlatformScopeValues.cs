using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.User;

/// <summary>Serialization and validation for stored cloud-platform scope JSON.</summary>
public static class CloudPlatformScopeValues
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    public static CloudPlatformScopeDto Default { get; } = new();

    public static CloudPlatformScopeDto NormalizeOrDefault(string? storedJson)
    {
        CloudPlatformScopeDto? parsed = TryParse(storedJson);

        return parsed ?? Default;
    }

    public static CloudPlatformScopeDto? TryParse(string? storedJson)
    {
        if (string.IsNullOrWhiteSpace(storedJson))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<CloudPlatformScopeDto>(storedJson.Trim(), JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static string Serialize(CloudPlatformScopeDto scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return JsonSerializer.Serialize(scope, JsonOptions);
    }
}
