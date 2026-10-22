namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorStepResult
{
    public required string StepId { get; init; }

    public required string DisplayName { get; init; }

    public required StackDoctorVerdict Verdict { get; init; }

    public required string Detail { get; init; }

    public string? ArtifactPath { get; init; }
}
