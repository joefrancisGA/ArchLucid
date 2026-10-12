using System.Text.Json.Serialization;

namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunManifest
{
    public Guid RunId { get; init; }
    public Guid? TenantId { get; init; }
    public string AgentVersion { get; init; } = string.Empty;
    public string? Schedule { get; init; }
    public DateTime StartedUtc { get; init; }
    public DateTime? FinishedUtc { get; init; }
    public string Status { get; init; } = string.Empty;
    public string[] SubscriptionsCovered { get; init; } = [];
    public string? ErrorSummary { get; init; }
    [JsonPropertyName("packageBlobPath")]
    public string? ZipPath { get; init; }
    [JsonPropertyName("packageSha256")]
    public string? ZipSha256 { get; init; }
    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion { get; init; }
}
