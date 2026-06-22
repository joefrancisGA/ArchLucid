namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Outcome of <see cref="AgentExplainabilityTraceValidator.ValidateMappedAgentFinding" />.
/// </summary>
public sealed class AgentExplainabilityTraceValidationResult
{
    public bool IsValid
    {
        get;
        init;
    }

    public IReadOnlyList<string> Errors
    {
        get;
        init;
    } = [];

    public static AgentExplainabilityTraceValidationResult Success() =>
        new() { IsValid = true };

    public static AgentExplainabilityTraceValidationResult Failure(IReadOnlyList<string> errors) =>
        new() { IsValid = false, Errors = errors };
}
