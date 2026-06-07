using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>
///     Builds deterministic <c>export-manifest.json</c> payloads for run export ZIP packages (ADR 0040 / TB-307).
/// </summary>
public static class ExportManifestBuilder
{
    private static readonly JsonSerializerOptions JsonWrite = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>SHA-256 over <paramref name="content" /> rendered as UPPER hex (matches manifest hash service).</summary>
    public static string ComputeSha256UpperHex(ReadOnlySpan<byte> content)
    {
        Span<byte> hash = stackalloc byte[SHA256.HashSizeInBytes];
        SHA256.HashData(content, hash);

        return Convert.ToHexString(hash);
    }

    /// <summary>
    ///     Serializes the export manifest JSON. <paramref name="fileEntries" /> must exclude
    ///     <c>export-manifest.json</c> itself and be pre-sorted by path (ordinal).
    /// </summary>
    public static string BuildJson(
        Guid runId,
        Guid manifestId,
        DateTime createdUtc,
        string? committedManifestHash,
        string? ruleSetId,
        string? ruleSetHash,
        IReadOnlyList<ExportManifestFileEntry> fileEntries)
    {
        ArgumentNullException.ThrowIfNull(fileEntries);

        ExportManifestDocument document = new()
        {
            SchemaVersion = 1,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = createdUtc,
            CommittedManifestHash = committedManifestHash ?? string.Empty,
            RuleSetId = ruleSetId ?? string.Empty,
            RuleSetHash = ruleSetHash ?? string.Empty,
            Files = fileEntries
        };

        return JsonSerializer.Serialize(document, JsonWrite);
    }

    private sealed class ExportManifestDocument
    {
        public int SchemaVersion
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public Guid ManifestId
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string CommittedManifestHash
        {
            get;
            init;
        } = null!;

        public string RuleSetId
        {
            get;
            init;
        } = null!;

        public string RuleSetHash
        {
            get;
            init;
        } = null!;

        public IReadOnlyList<ExportManifestFileEntry> Files
        {
            get;
            init;
        } = null!;
    }
}
