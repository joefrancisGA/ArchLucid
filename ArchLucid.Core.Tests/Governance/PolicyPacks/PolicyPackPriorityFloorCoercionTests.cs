using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackPriorityFloorCoercionTests
{
    [Fact]
    public void ResolveFloor_string_encoded_whole_number_p2_maps_p2()
    {
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults = { [PolicyPackRulePriority.AdvisoryDefaultsKey] = "2.0" },
        };

        PolicyPackPriorityFloor.ResolveFloor(effective).Should().Be(PolicyPackRulePriority.P2);
    }

    [Fact]
    public void ResolveFloor_string_encoded_whole_number_p0_maps_p0()
    {
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults = { [PolicyPackRulePriority.AdvisoryDefaultsKey] = "0.0" },
        };

        PolicyPackPriorityFloor.ResolveFloor(effective).Should().Be(PolicyPackRulePriority.P0);
    }

    [Fact]
    public void ResolveFloor_off_synonym_ignores_boolean_synonym()
    {
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults = { [PolicyPackRulePriority.AdvisoryDefaultsKey] = "off" },
        };

        PolicyPackPriorityFloor.ResolveFloor(effective).Should().Be(PolicyPackRulePriority.P1);
    }
}
