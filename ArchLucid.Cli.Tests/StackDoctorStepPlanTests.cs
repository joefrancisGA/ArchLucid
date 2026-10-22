using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorStepPlanTests
{
    [Theory]
    [InlineData(StackDoctorProfile.FirstPilotMinimum, 2)]
    [InlineData(StackDoctorProfile.StagingRealLlm, 2)]
    [InlineData(StackDoctorProfile.ProductionLike, 2)]
    [InlineData(StackDoctorProfile.StagingDeploy, 3)]
    [InlineData(StackDoctorProfile.PostDeploy, 2)]
    public void Resolve_ReturnsExpectedStepCount(string profile, int expectedCount)
    {
        IReadOnlyList<StackDoctorStepDefinition> steps = StackDoctorStepPlan.Resolve(profile);

        steps.Should().HaveCount(expectedCount);
    }

    [Fact]
    public void Resolve_StagingDeploy_IncludesTerraformDriftAndProductionLikeLint()
    {
        IReadOnlyList<StackDoctorStepDefinition> steps = StackDoctorStepPlan.Resolve(StackDoctorProfile.StagingDeploy);

        steps.Should().Contain(step => step.Kind == StackDoctorStepKind.TerraformDriftScript);
        steps.Should().Contain(step =>
            step.Kind == StackDoctorStepKind.ConfigLint && step.ProductionLikeConfigLint);
        steps.Single(step => step.Kind == StackDoctorStepKind.PrerequisitesScript)
            .PrerequisitesProfile
            .Should()
            .Be("ProductionLike");
    }

    [Fact]
    public void Resolve_PostDeploy_IncludesHttpVerificationSteps()
    {
        IReadOnlyList<StackDoctorStepDefinition> steps = StackDoctorStepPlan.Resolve(StackDoctorProfile.PostDeploy);

        steps.Should().Contain(step => step.Kind == StackDoctorStepKind.DeploymentEvidence);
        steps.Should().Contain(step => step.Kind == StackDoctorStepKind.OnboardPreflight);
    }
}
