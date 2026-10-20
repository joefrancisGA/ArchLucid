using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Builds synthetic change rows for resources present in both snapshots with no recorded delta.</summary>
public static class AzureInventoryDiffUnchangedBuilder
{
    public static List<AzureInventoryChangeRecord> BuildUnchangedResourceChanges(
        IReadOnlyList<AzureInventoryResourceRecord> resourcesA,
        IReadOnlyList<AzureInventoryResourceRecord> resourcesB,
        Guid diffId,
        Guid snapshotAId,
        Guid snapshotBId,
        IReadOnlySet<string> changedAzureResourceIds)
    {
        ArgumentNullException.ThrowIfNull(resourcesA);
        ArgumentNullException.ThrowIfNull(resourcesB);
        ArgumentNullException.ThrowIfNull(changedAzureResourceIds);

        Dictionary<string, AzureInventoryResourceRecord> resourcesAMap =
            resourcesA.ToDictionary(resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, AzureInventoryResourceRecord> resourcesBMap =
            resourcesB.ToDictionary(resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        List<AzureInventoryChangeRecord> unchanged = [];

        foreach (KeyValuePair<string, AzureInventoryResourceRecord> pair in resourcesAMap)
        {
            if (changedAzureResourceIds.Contains(pair.Key))
            {
                continue;
            }

            if (!resourcesBMap.TryGetValue(pair.Key, out AzureInventoryResourceRecord? resourceB))
            {
                continue;
            }

            AzureInventoryResourceRecord resourceA = pair.Value;

            if (AzureInventoryNeverShowArmTypes.ShouldOmitResource(resourceA.ResourceType, pair.Key)
                || AzureInventoryNeverShowArmTypes.ShouldOmitResource(resourceB.ResourceType, pair.Key))
            {
                continue;
            }

            unchanged.Add(new AzureInventoryChangeRecord
            {
                ChangeId = CreateDeterministicChangeId(diffId, pair.Key),
                DiffId = diffId,
                SnapshotAId = snapshotAId,
                SnapshotBId = snapshotBId,
                CloudResourceId = resourceB.CloudResourceId ?? resourceA.CloudResourceId,
                AzureResourceId = pair.Key,
                ChangeType = AzureInventoryChangeType.ResourceUnchanged,
                Property = null,
                OldValue = resourceA.ResourceType,
                NewValue = resourceB.ResourceType,
                RiskClassification = AzureInventoryDiffHeuristics.BuildRiskClassification(
                    AzureInventoryChangeType.ResourceUnchanged),
                SecuritySignificance = AzureInventoryDiffHeuristics.BuildSecuritySignificance(
                    AzureInventoryChangeType.ResourceUnchanged),
                Confidence = 1.0m,
                EvidenceReference = "azure-inventory-snapshot",
                ProvenanceKind = ProvenanceKind.DerivedFact,
            });
        }

        return unchanged
            .OrderBy(change => change.AzureResourceId, StringComparer.Ordinal)
            .ToList();
    }

    private static Guid CreateDeterministicChangeId(Guid diffId, string azureResourceId)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{diffId:N}|{azureResourceId}"));

        return new Guid(hash.AsSpan(0, 16));
    }
}
