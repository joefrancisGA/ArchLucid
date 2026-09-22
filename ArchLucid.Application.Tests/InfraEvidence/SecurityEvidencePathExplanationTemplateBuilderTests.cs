using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathExplanationTemplateBuilderTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid SnapshotId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
    private static readonly Guid PathId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");

    [Fact]
    public void Build_omits_network_slot_and_keeps_grammar_without_network_clause()
    {
        SecurityEvidencePathRecord path = CreatePath(PathKind.Privilege, "Role assignment inferred from tag metadata.");
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(
                1,
                "azure-ad://principal/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                GraphEdgeTypes.HasRole),
            CreateHop(
                2,
                "azure-ad://principal/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                GraphEdgeTypes.CanRead),
        ];

        SecurityEvidencePathExplanationTemplateResponse template =
            SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops, []);

        template.Network.Should().BeNull();
        template.ArchitectSentence.Should().NotBeNullOrWhiteSpace();
        template.ArchitectSentence.Should().Contain("through identity ");
        template.ArchitectSentence.Should().Contain(" to asset sa1.");
        template.ArchitectSentence.Should().NotContain("and network path");
        SecureNowArchitectHonestyCopyGuard.IsHonestCopy(template.ArchitectSentence).Should().BeTrue();
    }

    [Fact]
    public void Build_fills_proposed_change_and_verify_from_primary_cut_point()
    {
        SecurityEvidencePathRecord path = CreatePath(PathKind.Privilege, "Derived CAN_READ hop uses Probable confidence.");
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(
                1,
                "Internet",
                "app-gateway",
                GraphEdgeTypes.Exposes),
            CreateHop(
                2,
                "app-gateway",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                GraphEdgeTypes.CanRead),
        ];

        SecurityEvidenceCutPointRecord cutPoint = new()
        {
            CutPointId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            TenantId = TenantId,
            SnapshotId = SnapshotId,
            CutKind = SecurityEvidenceCutPointKind.Edge,
            CutKey = "public-exposure",
            FromNodeId = "Internet",
            ToNodeId = "app-gateway",
            EdgeType = GraphEdgeTypes.Exposes,
            PathsCollapsedCount = 3,
            OperationalCostClass = SecurityEvidenceCutPointOperationalCostClass.PublicAccessProperty,
            LeverageScore = 1.5m,
            CutOrder = 1,
            EvidenceReferencesJson = "[\"snapshot:verify-public-closure\"]",
            SuggestedPatternKey = "network.restrict-public",
        };

        SecurityEvidencePathExplanationTemplateResponse template =
            SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops, [cutPoint]);

        template.ProposedChange.Should().Be("network restrict public");
        template.Verify.Should().Be("snapshot:verify-public-closure");
        template.ArchitectSentence.Should().Contain("Change network restrict public will break the path");
        template.ArchitectSentence.Should().Contain("Verify using snapshot:verify-public-closure.");
    }

    [Fact]
    public void Build_uses_capability_to_flow_may_access_language()
    {
        SecurityEvidencePathRecord path = CreatePath(PathKind.CapabilityToFlow, "Outbound NSG allow rule is Possible.");
        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(
                1,
                "azure-ad://principal/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1",
                GraphEdgeTypes.HasRole),
        ];

        SecurityEvidencePathExplanationTemplateResponse template =
            SecurityEvidencePathExplanationTemplateBuilder.Build(path, hops, []);

        template.ArchitectSentence.Should().StartWith("This configuration may allow ");
        template.ArchitectSentence.Should().Contain("to access asset sql1.");
        SecureNowArchitectHonestyCopyGuard.IsHonestCopy(template.ArchitectSentence).Should().BeTrue();
    }

    [Theory]
    [InlineData("This path is 82% confirmed.")]
    [InlineData("Data exfiltrated to the internet.")]
    [InlineData("The tenant is SOC 2 compliant per auditor review.")]
    [InlineData("Apply to Azure now to remediate.")]
    public void HonestyCopyGuard_rejects_deny_list_language(string copy)
    {
        SecureNowArchitectHonestyCopyGuard.IsHonestCopy(copy).Should().BeFalse();
    }

    [Fact]
    public void BuildArchitectSentence_rejects_sentence_when_guard_would_fail()
    {
        string sentence = SecurityEvidencePathExplanationTemplateBuilder.BuildArchitectSentence(
            PathKind.Privilege,
            actor: "Internet",
            identity: null,
            network: null,
            asset: "sa1",
            weakControl: "82% confidence on role assignment",
            proposedChange: null,
            verify: null);

        sentence.Should().BeEmpty();
    }

    private static SecurityEvidencePathRecord CreatePath(PathKind pathKind, string weakestHopReason) =>
        new()
        {
            PathId = PathId,
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"),
            ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3"),
            SnapshotId = SnapshotId,
            PathKind = pathKind,
            PathConfidenceBand = PathConfidenceBand.Probable,
            CanonicalHopHashSha256 = [1, 2, 3],
            WeakestHopOrdinal = 2,
            WeakestHopReason = weakestHopReason,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static SecurityEvidencePathHopRecord CreateHop(
        int hopOrdinal,
        string fromNodeId,
        string toNodeId,
        string edgeType) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = PathId,
            TenantId = TenantId,
            HopOrdinal = hopOrdinal,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            HopConfidenceBand = PathConfidenceBand.Probable,
            EvidenceReference = $"snapshot:{SnapshotId:D}:{edgeType}",
        };
}
