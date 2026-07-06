using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorProfileResolverTests
{
    [Theory]
    [InlineData("dev", StackDoctorProfile.FirstPilotMinimum)]
    [InlineData("pilot", StackDoctorProfile.FirstPilotMinimum)]
    [InlineData("staging", StackDoctorProfile.StagingRealLlm)]
    [InlineData("production", StackDoctorProfile.ProductionLike)]
    public void MapStackEnvironment_MapsKnownValues(string environment, string expectedProfile)
    {
        StackDoctorProfileResolver.MapStackEnvironment(environment).Should().Be(expectedProfile);
    }
}
