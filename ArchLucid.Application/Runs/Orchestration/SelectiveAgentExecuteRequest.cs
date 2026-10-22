namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     TB-938: selection for selective agent re-execute (task ids and/or agent types).
/// </summary>
public sealed class SelectiveAgentExecuteRequest
{
    /// <summary>Optional task ids to force re-execute.</summary>
    public IReadOnlyList<string>? TaskIds
    {
        get;
        init;
    }

    /// <summary>Optional agent type names (e.g. Cost, Critic) to force re-execute.</summary>
    public IReadOnlyList<string>? AgentTypes
    {
        get;
        init;
    }

    /// <summary>
    ///     When true (default), clearing Topology/Cost/Compliance also clears Critic so stale critic output cannot commit.
    /// </summary>
    public bool IncludeDependents
    {
        get;
        init;
    } = true;

    /// <summary>
    ///     Optional knowledge-model element ids to scope incremental re-review after selective execute.
    ///     When omitted, element ids are inferred from re-executed agent types.
    /// </summary>
    public IReadOnlyList<string>? AffectedElementIds
    {
        get;
        init;
    }
}
