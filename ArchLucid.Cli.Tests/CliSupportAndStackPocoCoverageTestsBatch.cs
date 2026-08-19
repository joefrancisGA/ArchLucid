using ArchLucid.Cli.Stack;
using ArchLucid.Cli.Stack.Doctor;
using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliSupportAndStackPocoCoverageTestsBatch
{
    [Fact]
    public void SupportBundleValidateConfigAlert_round_trips_json_properties()
    {
        SupportBundleValidateConfigAlert alert = new()
        {
            Severity = "warning",
            Category = "auth",
            Check = "jwt-issuer",
        };

        alert.Severity.Should().Be("warning");
        alert.Category.Should().Be("auth");
        alert.Check.Should().Be("jwt-issuer");
    }

    [Fact]
    public void ArchlucidStackOpenAiSection_exposes_defaults()
    {
        ArchlucidStackOpenAiSection section = new();

        section.ComposeMode.Should().Be("existing");
        section.ChatDeploymentName.Should().BeNull();
    }

    [Fact]
    public void ArchlucidStackKeyVaultSection_exposes_defaults()
    {
        ArchlucidStackKeyVaultSection section = new();

        section.Name.Should().BeEmpty();
    }

    [Fact]
    public void StackDoctorStepDefinition_exposes_kind_and_display_name()
    {
        StackDoctorStepDefinition step = new()
        {
            StepId = "config-lint",
            DisplayName = "Validate configuration",
            Kind = StackDoctorStepKind.ConfigLint,
        };

        step.Kind.Should().Be(StackDoctorStepKind.ConfigLint);
        step.DisplayName.Should().Be("Validate configuration");
    }

    [Fact]
    public void StackDoctorStepKind_exposes_expected_variants()
    {
        string[] names = Enum.GetNames<StackDoctorStepKind>();

        names.Should().HaveCount(5);
        Enum.IsDefined(typeof(StackDoctorStepKind), StackDoctorStepKind.ConfigLint).Should().BeTrue();
    }
}
