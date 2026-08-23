using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Coverage;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CoveragePreviewServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Preview_lists_six_baseline_dimensions_for_focused_mode()
    {
        InMemoryPolicyPackRepository packRepository = new();
        await SeedBaselinePacksAsync(packRepository);

        CoveragePreviewService service = new(packRepository, new InMemoryPolicyPackAssignmentRepository());
        CoveragePreviewResult preview = await service.PreviewAsync(
            TestScope,
            new CoveragePreviewInput { FocusedPilotModeEnabled = true });

        preview.ProviderNeutralBaselineCount.Should().Be(6);
        preview.Assignments.Should().OnlyContain(row => row.CoverageType == CoverageType.ProviderNeutralBaseline);
        preview.Assignments.Should().OnlyContain(row => row.IncludedInRunEvaluation);
    }

    [Fact]
    public async Task Preview_includes_azure_overlay_when_cloud_target_is_azure()
    {
        InMemoryPolicyPackRepository packRepository = new();
        await SeedBaselinePacksAsync(packRepository);
        await packRepository.CreateAsync(
            CreatePack(DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName),
            CancellationToken.None);

        CoveragePreviewService service = new(packRepository, new InMemoryPolicyPackAssignmentRepository());
        CoveragePreviewResult preview = await service.PreviewAsync(
            TestScope,
            new CoveragePreviewInput
            {
                CloudProvider = CloudProvider.Azure,
                FocusedPilotModeEnabled = true,
            });

        preview.PlatformOverlayCount.Should().Be(1);
        preview.Assignments.Should().Contain(row =>
            row.PolicyPackDisplayName == DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName
            && row.IncludedInRunEvaluation);
    }

    [Fact]
    public async Task Preview_includes_contextual_pci_pack_when_intake_mentions_pci()
    {
        InMemoryPolicyPackRepository packRepository = new();
        await SeedBaselinePacksAsync(packRepository);
        await packRepository.CreateAsync(
            CreatePack("PCI-DSS (Architecture / Segmentation)"),
            CancellationToken.None);

        CoveragePreviewService service = new(packRepository, new InMemoryPolicyPackAssignmentRepository());
        CoveragePreviewResult preview = await service.PreviewAsync(
            TestScope,
            new CoveragePreviewInput
            {
                FocusedPilotModeEnabled = true,
                SecurityIntakeAnswer = "Stores PCI cardholder data.",
            });

        preview.ContextualRecommendedCount.Should().Be(1);
        preview.Assignments.Should().Contain(row =>
            row.PolicyPackDisplayName == "PCI-DSS (Architecture / Segmentation)"
            && row.IncludedInRunEvaluation);
    }

    private static async Task SeedBaselinePacksAsync(InMemoryPolicyPackRepository packRepository)
    {
        foreach (string displayName in FocusedPilotModePolicyPacks.AllowedPackDisplayNames)
        {
            PolicyPack pack = CreatePack(displayName);
            pack.QualityDimension = DefaultPolicyPackCatalog.TryResolveBaselineQualityDimension(displayName);
            await packRepository.CreateAsync(pack, CancellationToken.None);
        }
    }

    private static PolicyPack CreatePack(string displayName) => new()
    {
        PolicyPackId = Guid.NewGuid(),
        TenantId = TestScope.TenantId,
        WorkspaceId = TestScope.WorkspaceId,
        ProjectId = TestScope.ProjectId,
        Name = displayName,
        PackType = PolicyPackType.PlatformDefault,
        CurrentVersion = "1.0.0",
    };
}
