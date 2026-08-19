namespace ArchLucid.Core.Ask;

/// <summary>Static high-value Ask prompts for new operators (Improvement #11).</summary>
public static class AskPromptTemplateCatalog
{
    /// <summary>Returns the default template list exposed by <c>GET /v1/ask/templates</c>.</summary>
    public static IReadOnlyList<AskPromptTemplate> GetTemplates()
    {
        return
        [
            new AskPromptTemplate
            {
                Id = "security-boundaries",
                Title = "Security boundaries",
                Prompt = "Summarize the security boundaries and trust zones in this architecture.",
            },
            new AskPromptTemplate
            {
                Id = "single-points-of-failure",
                Title = "Single points of failure",
                Prompt = "List the single points of failure and suggest mitigations grounded in the manifest.",
            },
            new AskPromptTemplate
            {
                Id = "cost-hotspots",
                Title = "Cost hotspots",
                Prompt = "Which components drive the highest recurring cost, and what rightsizing options exist?",
            },
            new AskPromptTemplate
            {
                Id = "compliance-gaps",
                Title = "Compliance gaps",
                Prompt = "What compliance or policy-pack gaps should we address before the next commit?",
            },
            new AskPromptTemplate
            {
                Id = "prior-decisions",
                Title = "Prior decisions",
                Prompt = "What did we decide on the last committed run, and what changed since then?",
            },
        ];
    }
}
