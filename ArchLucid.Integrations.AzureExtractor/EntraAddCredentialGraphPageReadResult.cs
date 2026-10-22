using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

internal sealed class EntraAddCredentialGraphPageReadResult
{
    public bool Forbidden
    {
        get;
        init;
    }

    public IReadOnlyList<JsonElement> Items
    {
        get;
        init;
    } = [];

    public string? NextLink
    {
        get;
        init;
    }
}
