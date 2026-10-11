namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunManifest
{
    public Guid RunId { get; init; }
    public string AgentVersion { get; init; } = string.Empty;
    public DateTime StartedUtc { get; init; }
    public DateTime? FinishedUtc { get; init; }
    public string Status { get; init; } = string.Empty;
    public string[] SubscriptionsCovered { get; init; } = [];
    public string? ErrorSummary { get; init; }
    public string? ZipPath { get; init; }
    public string? ZipSha256 { get; init; }
    public int SchemaVersion { get; init; }
}
