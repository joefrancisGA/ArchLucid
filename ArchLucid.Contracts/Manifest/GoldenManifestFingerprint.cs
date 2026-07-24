using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Deterministic SHA-256 fingerprints for a <see cref="GoldenManifest" />.
/// </summary>
/// <remarks>
///     <see cref="ComputeSha256Hex" /> hashes the full DTO (includes per-run <c>RunId</c> and timestamps).
///     <see cref="ComputeContentSha256Hex" /> is the golden-cohort / lock-baseline hasher: it excludes
///     ephemeral run identity so Simulator create→execute→commit stays comparable across CI runs.
/// </remarks>
public static class GoldenManifestFingerprint
{
    /// <summary>Uppercase hex SHA-256 over full contract JSON for <paramref name="manifest" />.</summary>
    public static string ComputeSha256Hex(GoldenManifest manifest)
    {
        if (manifest is null)
            throw new ArgumentNullException(nameof(manifest));

        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(manifest, ContractJson.Default));

        return Convert.ToHexString(SHA256.HashData(utf8));
    }

    /// <summary>
    ///     Uppercase hex SHA-256 over structural manifest content only (excludes <c>RunId</c>,
    ///     <c>Metadata.CreatedUtc</c>, and <c>Metadata.DecisionTraceIds</c>).
    /// </summary>
    public static string ComputeContentSha256Hex(GoldenManifest manifest)
    {
        if (manifest is null)
            throw new ArgumentNullException(nameof(manifest));

        ManifestGovernance governance = manifest.Governance ?? new ManifestGovernance();
        ManifestMetadata metadata = manifest.Metadata ?? new ManifestMetadata();

        // Anonymous projection keeps the hasher free of per-run identity while preserving
        // topology + governance that golden-cohort baselines are meant to lock.
        object canonical = new
        {
            systemName = manifest.SystemName ?? string.Empty,
            services = (manifest.Services ?? [])
                .OrderBy(s => s.ServiceId, StringComparer.Ordinal)
                .ThenBy(s => s.ServiceName, StringComparer.Ordinal)
                .Select(s => new
                {
                    s.ServiceId,
                    s.ServiceName,
                    serviceType = s.ServiceType.ToString(),
                    runtimePlatform = s.RuntimePlatform.ToString(),
                    s.Purpose,
                    s.AzureArmRegion,
                    s.AzurePricingSku,
                    s.InstanceCount,
                    tags = (s.Tags ?? []).OrderBy(t => t, StringComparer.Ordinal).ToArray(),
                    requiredControls = (s.RequiredControls ?? []).OrderBy(c => c, StringComparer.Ordinal).ToArray()
                })
                .ToArray(),
            datastores = (manifest.Datastores ?? [])
                .OrderBy(d => d.DatastoreId, StringComparer.Ordinal)
                .ThenBy(d => d.DatastoreName, StringComparer.Ordinal)
                .Select(d => new
                {
                    d.DatastoreId,
                    d.DatastoreName,
                    datastoreType = d.DatastoreType.ToString(),
                    runtimePlatform = d.RuntimePlatform.ToString(),
                    d.Purpose,
                    d.PrivateEndpointRequired,
                    d.EncryptionAtRestRequired,
                    d.AzureArmRegion,
                    d.AzurePricingSku,
                    d.InstanceCount
                })
                .ToArray(),
            relationships = (manifest.Relationships ?? [])
                .OrderBy(r => r.RelationshipId, StringComparer.Ordinal)
                .ThenBy(r => r.SourceId, StringComparer.Ordinal)
                .ThenBy(r => r.TargetId, StringComparer.Ordinal)
                .Select(r => new
                {
                    r.RelationshipId,
                    r.SourceId,
                    r.TargetId,
                    relationshipType = r.RelationshipType.ToString(),
                    r.Description
                })
                .ToArray(),
            governance = new
            {
                complianceTags = (governance.ComplianceTags ?? []).OrderBy(t => t, StringComparer.Ordinal).ToArray(),
                policyConstraints = (governance.PolicyConstraints ?? []).OrderBy(t => t, StringComparer.Ordinal).ToArray(),
                requiredControls = (governance.RequiredControls ?? []).OrderBy(t => t, StringComparer.Ordinal).ToArray(),
                governance.RiskClassification,
                governance.CostClassification
            },
            metadata = new
            {
                metadata.ManifestVersion,
                metadata.ParentManifestVersion,
                metadata.ChangeDescription
            }
        };

        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(canonical, ContractJson.Default));

        return Convert.ToHexString(SHA256.HashData(utf8));
    }

    /// <summary>Parses JSON then computes <see cref="ComputeSha256Hex" /> (stable round-trip).</summary>
    public static string ComputeSha256HexFromManifestJson(string manifestJson)
    {
        if (string.IsNullOrWhiteSpace(manifestJson))
            throw new ArgumentException("Manifest JSON is required.", nameof(manifestJson));

        GoldenManifest? manifest = JsonSerializer.Deserialize<GoldenManifest>(manifestJson, ContractJson.Default);

        return manifest is null
            ? throw new JsonException("Manifest JSON deserialized to null.")
            : ComputeSha256Hex(manifest);
    }

    /// <summary>Parses JSON then computes <see cref="ComputeContentSha256Hex" />.</summary>
    public static string ComputeContentSha256HexFromManifestJson(string manifestJson)
    {
        if (string.IsNullOrWhiteSpace(manifestJson))
            throw new ArgumentException("Manifest JSON is required.", nameof(manifestJson));

        GoldenManifest? manifest = JsonSerializer.Deserialize<GoldenManifest>(manifestJson, ContractJson.Default);

        return manifest is null
            ? throw new JsonException("Manifest JSON deserialized to null.")
            : ComputeContentSha256Hex(manifest);
    }
}
