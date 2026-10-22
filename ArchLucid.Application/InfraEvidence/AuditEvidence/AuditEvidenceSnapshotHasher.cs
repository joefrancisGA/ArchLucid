using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static class AuditEvidenceSnapshotHasher
{
    private static readonly JsonSerializerOptions CanonicalJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static byte[] ComputeItemHash(AuditEvidenceSnapshotItemRecord item)
    {
        ArgumentNullException.ThrowIfNull(item);

        string canonical = string.Join(
            '|',
            item.EvidenceRowId,
            item.RequirementId,
            item.CloudResourceId?.ToString() ?? string.Empty,
            item.AzureResourceId ?? string.Empty,
            item.EvidenceType,
            item.NormalizedPointer ?? string.Empty,
            item.RawPointer ?? string.Empty,
            (int)item.CollectionStatus,
            item.Summary);

        return SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
    }

    public static byte[] ComputeRootHash(IReadOnlyList<AuditEvidenceSnapshotItemRecord> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        if (items.Count == 0)
            return SHA256.HashData(Encoding.UTF8.GetBytes("empty-audit-evidence-snapshot"));

        List<string> itemHashes = items
            .Select(item => Convert.ToHexString(ComputeItemHash(item)))
            .Order(StringComparer.Ordinal)
            .ToList();

        string joined = string.Join('\n', itemHashes);
        return SHA256.HashData(Encoding.UTF8.GetBytes(joined));
    }

    public static bool HashesEqual(byte[] left, byte[] right)
    {
        if (left.Length == 0 || right.Length == 0)
            return false;

        return CryptographicOperations.FixedTimeEquals(left, right);
    }

    public static string SerializeSelectorVersions(IReadOnlyDictionary<string, string> selectorVersions) =>
        JsonSerializer.Serialize(selectorVersions, CanonicalJsonOptions);
}
