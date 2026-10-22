using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DiagramViewPlanValidatorTests
{
    [Fact]
    public void TryValidate_identity_mode_is_valid()
    {
        DiagramViewPlan plan = new()
        {
            MermaidMode = "identity",
            HonestyLabel = DiagramViewPlanValidator.DefaultHonestyLabel,
        };

        bool valid = DiagramViewPlanValidator.TryValidate(plan, null, out string? failureReason);

        valid.Should().BeTrue();
        failureReason.Should().BeNull();
    }

    [Fact]
    public void TryValidate_resource_group_without_name_is_invalid()
    {
        DiagramViewPlan plan = new()
        {
            MermaidMode = "resourceGroup",
            HonestyLabel = DiagramViewPlanValidator.DefaultHonestyLabel,
        };

        bool valid = DiagramViewPlanValidator.TryValidate(plan, null, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("resource group");
    }

    [Fact]
    public void TryValidate_neighborhood_without_seed_or_cloud_resource_is_invalid()
    {
        DiagramViewPlan plan = new()
        {
            MermaidMode = "dependencyNeighborhood",
            HonestyLabel = DiagramViewPlanValidator.DefaultHonestyLabel,
        };

        bool valid = DiagramViewPlanValidator.TryValidate(plan, null, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("seed");
    }

    [Fact]
    public void TryValidate_unknown_seed_in_allowlist_is_invalid()
    {
        DiagramViewPlan plan = new()
        {
            MermaidMode = "dependencyNeighborhood",
            SeedNodeId = "not-a-real-node",
            HonestyLabel = DiagramViewPlanValidator.DefaultHonestyLabel,
        };

        HashSet<string> allowedSeeds = new(StringComparer.Ordinal) { "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a" };

        bool valid = DiagramViewPlanValidator.TryValidate(plan, allowedSeeds, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("allowlist");
    }
}
