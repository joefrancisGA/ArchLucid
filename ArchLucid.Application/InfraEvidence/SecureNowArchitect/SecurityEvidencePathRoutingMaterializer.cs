using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Derives organizational routing rows from snapshot resource tags (SA-15).</summary>
public static class SecurityEvidencePathRoutingMaterializer
{
    private sealed record TagBinding(string TagKey, SecurityEvidencePathRoutingRole Role, int Priority);

    private static readonly TagBinding[] TagBindings =
    [
        new(SecurityEvidencePathRoutingConstants.TagKeyOwner, SecurityEvidencePathRoutingRole.BusinessOwner, 0),
        new(SecurityEvidencePathRoutingConstants.TagKeyTechnicalOwner, SecurityEvidencePathRoutingRole.TechnicalOwner, 0),
        new(SecurityEvidencePathRoutingConstants.TagKeyApplication, SecurityEvidencePathRoutingRole.TechnicalOwner, 1),
        new(SecurityEvidencePathRoutingConstants.TagKeySecurityOwner, SecurityEvidencePathRoutingRole.SecurityOwner, 0),
        new(SecurityEvidencePathRoutingConstants.TagKeyRemediator, SecurityEvidencePathRoutingRole.Remediator, 0),
        new(SecurityEvidencePathRoutingConstants.TagKeyVerificationOwner, SecurityEvidencePathRoutingRole.VerificationOwner, 0),
        new(SecurityEvidencePathRoutingConstants.TagKeyCostCenter, SecurityEvidencePathRoutingRole.RequiredApproval, 0),
    ];

    public static IReadOnlyList<SecurityEvidencePathRoutingRecord> MaterializeFromSnapshotTags(
        Guid tenantId,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        AzureInventorySnapshotDetailReadModel snapshot,
        DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(hops);
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<SecurityEvidencePathRoutingRole, (string Value, string SourceReference, int Priority)> winners = [];

        foreach (Guid cloudResourceId in ExtractCloudResourceIds(hops))
        {
            AzureInventoryResourceRecord? resource = snapshot.Resources
                .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

            if (resource is null)
            {
                continue;
            }

            IReadOnlyList<AzureInventoryTagReadModel> resourceTags = snapshot.Tags
                .Where(tag => tag.ResourceRowId == resource.ResourceRowId)
                .ToList();

            foreach (TagBinding binding in TagBindings)
            {
                AzureInventoryTagReadModel? tag = resourceTags.FirstOrDefault(candidate =>
                    string.Equals(candidate.TagKey, binding.TagKey, StringComparison.OrdinalIgnoreCase));

                if (tag is null || string.IsNullOrWhiteSpace(tag.TagValue))
                {
                    continue;
                }

                string trimmedValue = tag.TagValue.Trim();
                string sourceReference =
                    $"{SecurityEvidencePathRoutingConstants.SourcePrefixTag}{binding.TagKey}@{resource.AzureResourceId}";

                if (!winners.TryGetValue(binding.Role, out (string Value, string SourceReference, int Priority) existing)
                    || binding.Priority < existing.Priority)
                {
                    winners[binding.Role] = (trimmedValue, sourceReference, binding.Priority);
                }
            }
        }

        List<SecurityEvidencePathRoutingRecord> rows = [];

        foreach (KeyValuePair<SecurityEvidencePathRoutingRole, (string Value, string SourceReference, int Priority)> entry in winners)
        {
            rows.Add(new SecurityEvidencePathRoutingRecord
            {
                RoutingRowId = Guid.NewGuid(),
                TenantId = tenantId,
                PathId = pathId,
                Role = entry.Key,
                PrincipalId = entry.Value.Value,
                DisplayName = entry.Value.Value,
                ProvenanceKind = ProvenanceKind.DerivedFact,
                SourceReference = entry.Value.SourceReference,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            });
        }

        SecurityEvidencePathRoutingGuard.EnsureSeparationOfDuties(rows);

        return rows;
    }

    private static IReadOnlyList<Guid> ExtractCloudResourceIds(IReadOnlyList<SecurityEvidencePathHopRecord> hops) =>
        hops
            .Where(hop => hop.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
            .Select(hop => hop.CloudResourceId!.Value)
            .Distinct()
            .ToList();
}
