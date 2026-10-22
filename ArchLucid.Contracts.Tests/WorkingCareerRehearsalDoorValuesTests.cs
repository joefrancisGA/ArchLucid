using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class WorkingCareerRehearsalDoorValuesTests
{
    [Fact]
    public void ParseOrDefault_returns_career_when_unset()
    {
        WorkingCareerRehearsalDoorValues.ParseOrDefault(null).Should().Be(WorkingCareerRehearsalDoorValues.Career);
        WorkingCareerRehearsalDoorValues.ParseOrDefault("").Should().Be(WorkingCareerRehearsalDoorValues.Career);
        WorkingCareerRehearsalDoorValues.ParseOrDefault("simulator").Should().Be(WorkingCareerRehearsalDoorValues.Career);
    }

    [Fact]
    public void ParseOrDefault_accepts_career_and_rehearsal_case_insensitive()
    {
        WorkingCareerRehearsalDoorValues.ParseOrDefault("CAREER").Should().Be(WorkingCareerRehearsalDoorValues.Career);
        WorkingCareerRehearsalDoorValues.ParseOrDefault("Rehearsal").Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
    }

    [Fact]
    public void NormalizeOrNull_rejects_unknown_values()
    {
        WorkingCareerRehearsalDoorValues.NormalizeOrNull(null).Should().BeNull();
        WorkingCareerRehearsalDoorValues.NormalizeOrNull("simulator").Should().BeNull();
        WorkingCareerRehearsalDoorValues.NormalizeOrNull("career").Should().Be(WorkingCareerRehearsalDoorValues.Career);
    }

    [Fact]
    public void IsExplicitValue_is_true_only_for_known_doors()
    {
        WorkingCareerRehearsalDoorValues.IsExplicitValue("career").Should().BeTrue();
        WorkingCareerRehearsalDoorValues.IsExplicitValue("rehearsal").Should().BeTrue();
        WorkingCareerRehearsalDoorValues.IsExplicitValue(null).Should().BeFalse();
        WorkingCareerRehearsalDoorValues.IsExplicitValue("simulator").Should().BeFalse();
    }

    [Fact]
    public void Serialize_normalizes_known_doors()
    {
        WorkingCareerRehearsalDoorValues.Serialize("CAREER").Should().Be(WorkingCareerRehearsalDoorValues.Career);
        WorkingCareerRehearsalDoorValues.Serialize("rehearsal").Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
    }
}
