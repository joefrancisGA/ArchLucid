namespace ArchLucid.Core.Agents;

/// <summary>Per engine × task-type evaluation state (TB-2105). Absence is NotEvaluated, not null.</summary>
public enum AgentModelEvaluationStateKind
{
    NotEvaluated = 0,
    Evaluated = 1,
    Failed = 2,
}
