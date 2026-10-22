namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorStepDefinition
{
    internal required string StepId { get; init; }

    internal required string DisplayName { get; init; }

    internal required StackDoctorStepKind Kind { get; init; }

    internal string? PrerequisitesProfile { get; init; }

    internal bool ProductionLikeConfigLint { get; init; }
}
