namespace ArchLucid.AgentRuntime.Explanation;

/// <summary>
/// Configuration bound to <see cref="ExplanationService"/> for provenance on <see cref="ArchLucid.Core.Explanation.ExplanationResult"/>.
/// Model/deployment id comes from <see cref="IAgentCompletionClient.Descriptor"/>.
/// </summary>
public sealed class ExplanationServiceOptions
{
    /// <summary>Configuration path relative to root (bind via <c>Configure&lt;ExplanationServiceOptions&gt;</c>).</summary>
    public const string SectionPath = "AgentExecution:Explanation";

    /// <summary>Logical agent label shown to operators (e.g. run narrative explainer).</summary>
    public string AgentType { get; set; } = "run-explanation";

    public string? PromptTemplateId { get; set; }

    public string? PromptTemplateVersion { get; set; }

    public string? PromptContentHash { get; set; }
}
