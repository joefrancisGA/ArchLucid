using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.ContextIngestion.Mapping;

/// <summary>
///     Deterministic ids for mapped document and infrastructure declaration references so connector
///     delta keys stay stable across repeated <see cref="ContextIngestionRequestMapper.FromArchitectureRequest" /> calls.
/// </summary>
public static class ContextIngestionStableReferenceIds
{
    public static string ForDocument(string name, string contentType)
    {
        return StableId("doc", name, contentType);
    }

    public static string ForInfrastructureDeclaration(string name, string format)
    {
        return StableId("infra-decl", name, format);
    }

    private static string StableId(string kind, string part1, string part2)
    {
        byte[] hash = SHA256.HashData(
            Encoding.UTF8.GetBytes($"{kind}|{part1.Trim()}|{part2.Trim()}"));

        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
