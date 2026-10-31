using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Core.Comparison;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class DeterministicExplanationServiceComparisonHonestyTests
{
    private readonly DeterministicExplanationService _service =
        new(NullLogger<DeterministicExplanationService>.Instance);

    [Fact]
    public void ExtractMajorChanges_labels_missing_requirement_topology_and_control_names()
    {
        ComparisonResult comparison = new()
        {
            RequirementChanges =
            [
                new RequirementDelta { RequirementName = "", ChangeType = "Modified" },
            ],
            TopologyChanges =
            [
                new TopologyDelta { Resource = "  ", ChangeType = "Added" },
            ],
            SecurityChanges =
            [
                new SecurityDelta { ControlName = "", BaseStatus = "Pass", TargetStatus = "Fail" },
            ],
        };

        List<string> changes = _service.ExtractMajorChanges(comparison);

        changes.Should().Contain(line => line.Contains("Requirement name was not stored.", StringComparison.Ordinal));

        string topology = _service.FormatTopologyChanges(comparison);
        string security = _service.FormatSecurityChanges(comparison);

        topology.Should().Contain("Resource name was not stored.");
        security.Should().Contain("Control name was not stored.");
    }

    [Fact]
    public void Format_change_lists_use_not_stored_sentences_when_empty()
    {
        ComparisonResult comparison = new();

        _service.FormatRequirementChanges(comparison).Should().Be("No requirement changes were stored.");
        _service.FormatSecurityChanges(comparison).Should().Be("No security changes were stored.");
        _service.FormatTopologyChanges(comparison).Should().Be("No topology changes were stored.");
    }
}
