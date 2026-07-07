namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorReport
{
    internal required string Profile { get; init; }

    internal required string RepositoryRoot { get; init; }

    internal required DateTime GeneratedUtc { get; init; }

    internal required StackDoctorVerdict OverallVerdict { get; init; }

    internal required IReadOnlyList<StackDoctorStepResult> Steps { get; init; }

    internal string? JsonArtifactPath { get; init; }

    internal string? MarkdownArtifactPath { get; init; }
}
