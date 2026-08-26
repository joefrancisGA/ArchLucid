using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.ContextIngestion.Topology;

/// <summary>
///     Deterministic <see cref="Models.CanonicalObject.ObjectId" /> for topology hints so
///     cross-connector references (e.g. policy <c>applicableTopologyNodeIds</c>, <c>parentNodeId</c>)
///     align with <c>obj-{ObjectId}</c> graph node ids after ingestion.
/// </summary>
public static class TopologyHintStableObjectIds
{
    /// <summary>
    ///     Collapses slash-separated hint segments to a stable form (trim around each <c>/</c>).
    /// </summary>
    public static string CanonicalizeHintName(string trimmedHint)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(trimmedHint);

        if (!trimmedHint.Contains('/'))
            return trimmedHint;

        string[] segments = trimmedHint.Split(
            '/',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length == 0)
            return trimmedHint;

        return string.Join('/', segments);
    }

    /// <summary>32 lowercase hex characters (128 bits of SHA-256).</summary>
    public static string FromHintName(string topologyHintName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(topologyHintName);

        string canonical = CanonicalizeHintName(topologyHintName.Trim()).ToLowerInvariant();
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
