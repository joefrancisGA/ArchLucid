using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Manifest.Sections;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicySectionTests
{
    [Fact]
    public void Defaults_empty_control_violation_exemption_and_note_lists()
    {
        PolicySection section = new();

        section.SatisfiedControls.Should().BeEmpty();
        section.Violations.Should().BeEmpty();
        section.Exemptions.Should().BeEmpty();
        section.Notes.Should().BeEmpty();
    }

    [Fact]
    public void Carries_controls_violations_exemptions_and_notes()
    {
        PolicyControlItem satisfied = new()
        {
            ControlId = "AC-2",
            ControlName = "Account management",
            PolicyPack = "NIST",
            Description = "Lifecycle",
        };

        PolicyControlItem violation = new()
        {
            ControlId = "SC-7",
            ControlName = "Boundary",
            PolicyPack = "NIST",
            Description = "Segmentation",
        };

        DateTimeOffset expires = new(2027, 1, 1, 0, 0, 0, TimeSpan.Zero);

        PolicyExemption exemption = new()
        {
            ControlId = "SC-7",
            Justification = "Temporary waiver.",
            ExpiresUtc = expires.UtcDateTime,
        };

        PolicySection section = new()
        {
            SatisfiedControls = [satisfied],
            Violations = [violation],
            Exemptions = [exemption],
            Notes = ["See runbook RB-12"],
        };

        section.SatisfiedControls.Should().ContainSingle().Which.ControlId.Should().Be("AC-2");
        section.Violations.Should().ContainSingle().Which.ControlName.Should().Be("Boundary");
        section.Exemptions.Should().ContainSingle().Which.Justification.Should().Be("Temporary waiver.");
        section.Exemptions.Single().ExpiresUtc.Should().Be(expires.UtcDateTime);
        section.Notes.Should().Equal("See runbook RB-12");
    }
}
