using System.Text.Json;

using ArchLucid.Contracts.Compliance;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Stable JSON serialization for before/after diff artifacts (demo bundles and Verify snapshots).
/// </summary>
public static class PolicyPackBeforeAfterDiffArtifactJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    public static string Serialize(PolicyPackBeforeAfterDiffArtifact artifact) =>
        JsonSerializer.Serialize(artifact, SerializerOptions);

    public static PolicyPackBeforeAfterDiffArtifact Deserialize(string json) =>
        JsonSerializer.Deserialize<PolicyPackBeforeAfterDiffArtifact>(json, SerializerOptions)
        ?? throw new JsonException("Policy pack before/after diff artifact JSON was empty or invalid.");
}
