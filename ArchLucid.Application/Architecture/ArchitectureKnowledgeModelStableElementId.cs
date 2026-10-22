using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Deterministic element identity for intake-derived knowledge-model nodes.
/// </summary>
internal static class ArchitectureKnowledgeModelStableElementId
{
    internal static string FromKindAndName(ArchitectureElementKind kind, string name, string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string canonical = string.Join('\u001f', runId, kind.ToString(), name.Trim());
        byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        return new Guid(digest.AsSpan(0, 16)).ToString("N");
    }
}
