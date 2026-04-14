namespace ArchLucid.AgentRuntime.Evaluation.ReferenceCases;

/// <summary>Loaded reference cases for optional post-run scoring.</summary>
public interface IAgentOutputReferenceCaseCatalog
{
    IReadOnlyList<AgentOutputReferenceCaseDefinition> Cases { get; }
}
