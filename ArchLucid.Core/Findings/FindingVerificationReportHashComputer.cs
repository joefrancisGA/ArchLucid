using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Deterministic report hash for append-only verification artifacts.</summary>
public static class FindingVerificationReportHashComputer
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string Compute(
        Guid runId,
        string sourceManifestHash,
        Guid sourceFindingsSnapshotId,
        Guid? verificationFindingsSnapshotId,
        IReadOnlyList<FindingVerificationResultAppend> results)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceManifestHash);
        ArgumentNullException.ThrowIfNull(results);

        string payload = JsonSerializer.Serialize(
            new
            {
                runId,
                sourceManifestHash,
                sourceFindingsSnapshotId,
                verificationFindingsSnapshotId,
                results = results
                    .OrderBy(result => result.FindingId, StringComparer.Ordinal)
                    .Select(result => new
                    {
                        findingId = result.FindingId,
                        status = result.Status.ToString(),
                        traceText = result.TraceText,
                    }),
            },
            SerializerOptions);

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
