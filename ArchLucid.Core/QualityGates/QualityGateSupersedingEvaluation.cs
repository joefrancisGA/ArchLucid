namespace ArchLucid.Core.QualityGates;

/// <summary>
///     Append-only remediation row when a gate definition was later found wrong (TB-974).
///     Never UPDATE/DELETE the original recorded outcome; supersede is additive metadata only.
/// </summary>
public sealed class QualityGateSupersedingEvaluation
{
    public required Guid SupersedingEvaluationId
    {
        get;
        init;
    }

    public required string RunId
    {
        get;
        init;
    }

    public Guid? TraceId
    {
        get;
        init;
    }

    public required string ActorPrincipalId
    {
        get;
        init;
    }

    public required QualityGateWrongDefinitionClass MisclassificationClass
    {
        get;
        init;
    }

    public required string Reason
    {
        get;
        init;
    }

    public required QualityGateDefinitionSnapshot OriginalDefinition
    {
        get;
        init;
    }

    public required QualityGateDefinitionSnapshot SuccessorDefinition
    {
        get;
        init;
    }

    public required string OriginalRecordedOutcome
    {
        get;
        init;
    }

    public required string SupersedingOutcome
    {
        get;
        init;
    }

    public required DateTimeOffset RecordedAtUtc
    {
        get;
        init;
    }
}
