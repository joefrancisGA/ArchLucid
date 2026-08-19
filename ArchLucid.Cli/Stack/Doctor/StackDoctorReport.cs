namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorReport
{
    public required string Profile { get; init; }

    public required string RepositoryRoot { get; init; }

    public required DateTime GeneratedUtc { get; init; }

    public required StackDoctorVerdict OverallVerdict { get; init; }

    public required IReadOnlyList<StackDoctorStepResult> Steps { get; init; }

    public string? JsonArtifactPath { get; init; }

    public string? MarkdownArtifactPath { get; init; }
}
