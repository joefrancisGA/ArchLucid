namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <summary>Completes and schema-validates LLM JSON narratives for explanation flows.</summary>
public interface IExplanationLlmNarrativeStage
{
    Task<string?> CompleteAndValidateComparisonAsync(string userPrompt, CancellationToken ct);

    Task<string?> CompleteAndValidateRunAsync(string userPrompt, CancellationToken ct);
}
