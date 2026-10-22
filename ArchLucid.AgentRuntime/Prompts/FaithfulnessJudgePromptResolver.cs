using ArchLucid.AgentRuntime.PromptInjection;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>Materializes faithfulness judge system prompts with reproducibility metadata.</summary>
public static class FaithfulnessJudgePromptResolver
{
    public static ResolvedSystemPrompt Resolve(string? releaseLabel = null)
    {
        string text = FaithfulnessJudgeSystemPromptTemplate.GetText();

        if (!text.Contains(AzureResourceTagPromptSanitizer.IgnoreInstructionsInUntrustedTags, StringComparison.Ordinal))
        {
            text = text.TrimEnd() + Environment.NewLine + Environment.NewLine
                + AzureResourceTagPromptSanitizer.IgnoreInstructionsInUntrustedTags;
        }

        string contentSha256Hex = AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(text);

        return new ResolvedSystemPrompt(
            text,
            FaithfulnessJudgeSystemPromptTemplate.TemplateId,
            FaithfulnessJudgeSystemPromptTemplate.Version,
            contentSha256Hex,
            releaseLabel);
    }
}
