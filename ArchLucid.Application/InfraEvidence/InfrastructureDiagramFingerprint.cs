using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.InfraEvidence;

internal static class InfrastructureDiagramFingerprint
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string Compute(ArchitectureDiagramModelRecord diagram)
    {
        ArgumentNullException.ThrowIfNull(diagram);

        string canonicalPayload = JsonSerializer.Serialize(
            new
            {
                nodes = diagram.Nodes
                    .OrderBy(node => node.Id, StringComparer.Ordinal)
                    .ThenBy(node => node.Label, StringComparer.Ordinal)
                    .Select(node => new { id = node.Id, label = node.Label }),
                edges = diagram.Edges
                    .OrderBy(edge => edge.SourceId, StringComparer.Ordinal)
                    .ThenBy(edge => edge.TargetId, StringComparer.Ordinal)
                    .ThenBy(edge => edge.Label, StringComparer.Ordinal)
                    .Select(edge => new { source = edge.SourceId, target = edge.TargetId, label = edge.Label }),
            },
            JsonOptions);

        byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes(canonicalPayload));
        return Convert.ToHexString(digest).ToLowerInvariant();
    }
}
