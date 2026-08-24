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
        // Content types and declaration formats are matched case-insensitively by parsers and
        // SupportedContextDocumentContentTypes; stable ids must not churn on casing alone.
        byte[] hash = SHA256.HashData(
            Encoding.UTF8.GetBytes(
                $"{kind}|{part1.Trim().ToLowerInvariant()}|{part2.Trim().ToLowerInvariant()}"));

        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
