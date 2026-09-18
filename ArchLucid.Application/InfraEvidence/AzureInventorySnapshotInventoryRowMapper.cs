using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Maps snapshot inventory resources into drift-table rows when no diff is selected.</summary>
public static class AzureInventorySnapshotInventoryRowMapper
{
    public static AzureInventoryChangeRecord MapResource(Guid snapshotId, AzureInventoryResourceRecord resource)
    {
        ArgumentNullException.ThrowIfNull(resource);

        return new AzureInventoryChangeRecord
        {
            ChangeId = resource.ResourceRowId,
            DiffId = Guid.Empty,
            SnapshotAId = snapshotId,
            SnapshotBId = snapshotId,
            CloudResourceId = resource.CloudResourceId,
            AzureResourceId = resource.AzureResourceId,
            ChangeType = AzureInventoryChangeType.Unknown,
            Property = null,
            OldValue = null,
            NewValue = resource.ResourceType,
            RiskClassification = null,
            ArchitectureSignificance = null,
            SecuritySignificance = null,
            Confidence = null,
            EvidenceReference = resource.SourceEvidenceReference,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };
    }
}
