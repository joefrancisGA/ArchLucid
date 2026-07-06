using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorVerdictRollupTests
{
    [Fact]
    public void FromSteps_FailWinsOverWarn()
    {
        List<StackDoctorStepResult> steps =
        [
            PassStep(),
            WarnStep(),
            FailStep(),
        ];

        StackDoctorVerdictRollup.FromSteps(steps).Should().Be(StackDoctorVerdict.Fail);
    }

    [Fact]
    public void FromSteps_WarnWhenNoFail()
    {
        List<StackDoctorStepResult> steps = [PassStep(), WarnStep()];

        StackDoctorVerdictRollup.FromSteps(steps).Should().Be(StackDoctorVerdict.Warn);
    }

    [Fact]
    public void ToExitCode_MapsScriptConvention()
    {
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Pass).Should().Be(0);
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Warn).Should().Be(1);
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Fail).Should().Be(2);
    }

    private static StackDoctorStepResult PassStep() =>
        new()
        {
            StepId = "a",
            DisplayName = "A",
            Verdict = StackDoctorVerdict.Pass,
            Detail = "ok",
        };

    private static StackDoctorStepResult WarnStep() =>
        new()
        {
            StepId = "b",
            DisplayName = "B",
            Verdict = StackDoctorVerdict.Warn,
            Detail = "warn",
        };

    private static StackDoctorStepResult FailStep() =>
        new()
        {
            StepId = "c",
            DisplayName = "C",
            Verdict = StackDoctorVerdict.Fail,
            Detail = "fail",
        };
}
