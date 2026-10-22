using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorProfileTests
{
    [Theory]
    [InlineData("firstpilotminimum", StackDoctorProfile.FirstPilotMinimum)]
    [InlineData("stagingrealllm", StackDoctorProfile.StagingRealLlm)]
    [InlineData("post-deploy", StackDoctorProfile.PostDeploy)]
    public void TryNormalize_maps_known_profiles_case_insensitively(string raw, string expected)
    {
        bool ok = StackDoctorProfile.TryNormalize(raw, out string normalized);

        ok.Should().BeTrue();
        normalized.Should().Be(expected);
    }

    [Fact]
    public void TryNormalize_returns_false_for_unknown_profile()
    {
        bool ok = StackDoctorProfile.TryNormalize("unknown-profile", out string normalized);

        ok.Should().BeFalse();
        normalized.Should().BeEmpty();
    }

    [Fact]
    public void DescribeUsageList_includes_all_profiles()
    {
        string usage = StackDoctorProfile.DescribeUsageList();

        usage.Should().Contain(StackDoctorProfile.FirstPilotMinimum);
        usage.Should().Contain(StackDoctorProfile.ProductionLike);
        usage.Should().Contain(StackDoctorProfile.PostDeploy);
    }
}
