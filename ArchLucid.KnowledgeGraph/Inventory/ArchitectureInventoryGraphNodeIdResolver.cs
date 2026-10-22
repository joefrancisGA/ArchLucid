using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.KnowledgeGraph.Inventory;

internal static class ArchitectureInventoryGraphNodeIdResolver
{
    public static string ResolveFromArmResourceId(string azureResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(azureResourceId);

        string normalizedArmId = ArmResourceIdNormalizer.Normalize(azureResourceId);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedArmId));

        return "n_" + Convert.ToHexString(hash.AsSpan(0, 8)).ToLowerInvariant();
    }
}
