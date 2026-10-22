using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>GET result for a Recovery Services vault child protected-item list (RSV-03).</summary>
public sealed class HostedAzureVaultProtectedItemListResult
{
    public IReadOnlyList<JsonElement> Items
    {
        get;
        init;
    } = [];

    public bool Succeeded
    {
        get;
        init;
    }

    public int? HttpStatusCode
    {
        get;
        init;
    }
}
