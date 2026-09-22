using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.KnowledgeGraph.Inventory;

internal static class ArchitectureInventoryGraphNodeIdResolver
{
    public static string ResolveFromArmResourceId(string azureResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(azureResourceId);

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(azureResourceId));

        return "n_" + Convert.ToHexString(hash.AsSpan(0, 8)).ToLowerInvariant();
    }
}
