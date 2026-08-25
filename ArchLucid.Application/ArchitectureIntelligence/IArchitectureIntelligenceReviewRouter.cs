namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Routes Architecture Intelligence review capabilities between LLM-backed and heuristic implementations.
/// </summary>
public interface IArchitectureIntelligenceReviewRouter
{
    /// <summary>
    ///     When false, async review paths must use heuristic implementations only.
    /// </summary>
    bool IsLlmReviewEnabled
    {
        get;
    }
}
