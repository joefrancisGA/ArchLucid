namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorStepResult
{
    internal required string StepId { get; init; }

    internal required string DisplayName { get; init; }

    internal required StackDoctorVerdict Verdict { get; init; }

    internal required string Detail { get; init; }

    internal string? ArtifactPath { get; init; }
}
