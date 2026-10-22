namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderResourceRefReadModel
{
    public Guid CloudResourceId { get; init; }

    public string AzureResourceId { get; init; } = string.Empty;
}
