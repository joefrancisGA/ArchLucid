using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathRoutingMaterializerTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid PathId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CloudResourceId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void MaterializeFromSnapshotTags_owner_tag_produces_derived_fact_business_owner()
    {
        Guid resourceRowId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(CloudResourceId),
        ];

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            resourceRowId,
            tags: [CreateTag(resourceRowId, SecurityEvidencePathRoutingConstants.TagKeyOwner, "platform@contoso.com")]);

        IReadOnlyList<SecurityEvidencePathRoutingRecord> rows =
            SecurityEvidencePathRoutingMaterializer.MaterializeFromSnapshotTags(
                TenantId,
                PathId,
                hops,
                snapshot,
                utcNow);

        rows.Should().ContainSingle();
        rows[0].Role.Should().Be(SecurityEvidencePathRoutingRole.BusinessOwner);
        rows[0].PrincipalId.Should().Be("platform@contoso.com");
        rows[0].ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact);
        rows[0].SourceReference.Should().StartWith(SecurityEvidencePathRoutingConstants.SourcePrefixTag);
    }

    [Fact]
    public void MaterializeFromSnapshotTags_without_owner_tags_returns_empty_not_unknown_admin()
    {
        Guid resourceRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(resourceRowId, tags: []);

        IReadOnlyList<SecurityEvidencePathRoutingRecord> rows =
            SecurityEvidencePathRoutingMaterializer.MaterializeFromSnapshotTags(
                TenantId,
                PathId,
                [CreateHop(CloudResourceId)],
                snapshot,
                DateTime.UtcNow);

        rows.Should().BeEmpty();
    }

    [Fact]
    public void EnsureAllowedProvenance_rejects_observed_fact()
    {
        Action act = () => SecurityEvidencePathRoutingGuard.EnsureAllowedProvenance(ProvenanceKind.ObservedFact);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*DerivedFact*");
    }

    [Fact]
    public void EnsureSeparationOfDuties_rejects_remediator_equal_required_approval()
    {
        IReadOnlyList<SecurityEvidencePathRoutingRecord> rows =
        [
            CreateRoutingRow(SecurityEvidencePathRoutingRole.Remediator, "same-team"),
            CreateRoutingRow(SecurityEvidencePathRoutingRole.RequiredApproval, "same-team"),
        ];

        Action act = () => SecurityEvidencePathRoutingGuard.EnsureSeparationOfDuties(rows);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Separation of duties*");
    }

    private static SecurityEvidencePathHopRecord CreateHop(Guid cloudResourceId) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = PathId,
            TenantId = TenantId,
            HopOrdinal = 0,
            FromNodeId = "internet://public-exposure",
            ToNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
            EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.HighlyLikely,
            EvidenceReference = "snapshot",
            CloudResourceId = cloudResourceId,
        };

    private static AzureInventoryTagReadModel CreateTag(Guid resourceRowId, string key, string value) =>
        new()
        {
            ResourceRowId = resourceRowId,
            TagKey = key,
            TagValue = value,
        };

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        Guid resourceRowId,
        IReadOnlyList<AzureInventoryTagReadModel> tags)
    {
        AzureInventoryResourceRecord resource = new()
        {
            ResourceRowId = resourceRowId,
            CloudResourceId = CloudResourceId,
            AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa",
            ResourceType = "Microsoft.Storage/storageAccounts",
        };

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                PackageId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [resource],
            Tags = tags,
            Properties = [],
            Relationships = [],
            RoleAssignments = [],
            Diagnostics = [],
        };
    }

    private static SecurityEvidencePathRoutingRecord CreateRoutingRow(
        SecurityEvidencePathRoutingRole role,
        string principal) =>
        new()
        {
            RoutingRowId = Guid.NewGuid(),
            TenantId = TenantId,
            PathId = PathId,
            Role = role,
            PrincipalId = principal,
            DisplayName = principal,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            SourceReference = $"{SecurityEvidencePathRoutingConstants.SourcePrefixTag}owner@resource",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };
}
