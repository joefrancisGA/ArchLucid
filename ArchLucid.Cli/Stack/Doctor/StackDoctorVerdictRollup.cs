namespace ArchLucid.Cli.Stack.Doctor;

internal static class StackDoctorVerdictRollup
{
    internal static StackDoctorVerdict FromSteps(IReadOnlyList<StackDoctorStepResult> steps)
    {
        ArgumentNullException.ThrowIfNull(steps);

        if (steps.Any(static step => step.Verdict == StackDoctorVerdict.Fail))
            return StackDoctorVerdict.Fail;

        if (steps.Any(static step => step.Verdict == StackDoctorVerdict.Warn))
            return StackDoctorVerdict.Warn;

        if (steps.Count > 0 && steps.All(static step => step.Verdict == StackDoctorVerdict.Skipped))
            return StackDoctorVerdict.Skipped;

        return StackDoctorVerdict.Pass;
    }

    internal static int ToExitCode(StackDoctorVerdict verdict) =>
        verdict switch
        {
            StackDoctorVerdict.Pass => 0,
            StackDoctorVerdict.Warn => 1,
            StackDoctorVerdict.Fail => 2,
            StackDoctorVerdict.Skipped => 0,
            _ => 2,
        };
}
