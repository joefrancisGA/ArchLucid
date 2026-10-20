using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmChildCollectionReadResult
{
    public int StatusCode
    {
        get;
        init;
    }

    public IReadOnlyList<JsonElement> Values
    {
        get;
        init;
    } = [];

    public static HostedAzureArmChildCollectionReadResult Succeeded(IReadOnlyList<JsonElement> values)
    {
        return new HostedAzureArmChildCollectionReadResult
        {
            StatusCode = 200,
            Values = values,
        };
    }

    public static HostedAzureArmChildCollectionReadResult Failed(int statusCode)
    {
        return new HostedAzureArmChildCollectionReadResult
        {
            StatusCode = statusCode,
            Values = [],
        };
    }
}
