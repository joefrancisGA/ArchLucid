namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>A check of the configured Azure Storage minimum TLS version, not a handshake or reachability test.</summary>
public sealed record StorageMinimumTlsVerification(
    Guid CloudResourceId,
    StorageMinimumTlsOutcome Outcome,
    Guid? SnapshotId = null,
    DateTime? CapturedUtc = null,
    Guid? ResourceRowId = null,
    string? ObservedVersion = null)
{
    public string Version { get; init; } = VerifierVersion;
    public Guid? TenantId { get; init; }
    public Guid? WorkspaceId { get; init; }
    public Guid? ProjectId { get; init; }

    public const string VerifierVersion = "azure-storage-minimum-tls/1";
    public const string ExpectedVersion = "1.2";
}

public enum StorageMinimumTlsOutcome
{
    Unverified,
    Verified,
    Contradicted,
}
