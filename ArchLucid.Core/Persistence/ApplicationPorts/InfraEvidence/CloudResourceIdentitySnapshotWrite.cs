namespace ArchLucid.Persistence.InfraEvidence;

public sealed record CloudResourceIdentitySnapshotWrite(
    string ExternalResourceId,
    string? ResourceType,
    string? SubscriptionOrAccountId,
    string? ResourceGroupOrProject,
    string? Region,
    string? DisplayName);
