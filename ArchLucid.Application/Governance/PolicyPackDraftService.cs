using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Governance;

public sealed class PolicyPackDraftService(IAgentCompletionClient completionClient) : IPolicyPackDraftService
{
    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<DraftPolicyPackRuleResponse> DraftRuleAsync(
        DraftPolicyPackInput input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (string.IsNullOrWhiteSpace(input.FreeTextIntent))
            throw new ArgumentException("FreeTextIntent is required.", nameof(input));

        string fewShot = PolicyPackDraftFewShotExamples.BuildFewShotJson();
        string schema = PolicyPackDraftFewShotExamples.BuildSchemaDescription();

        const string systemPrompt = "You are a cloud governance expert. Based on the operator intent, draft ONE valid ArchLucid curated policy pack rule "
                                    + "JSON object conforming to the schema. Use the few-shot examples as style references. Return ONLY the rule JSON object.";

        string userPrompt =
            "Schema:\n" +
            schema +
            "\n\nExamples:\n" +
            fewShot +
            "\n\nOperator intent:\n" +
            input.FreeTextIntent.Trim();

        string draftJson = await _completionClient.CompleteJsonAsync(
            systemPrompt,
            userPrompt,
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        return new DraftPolicyPackRuleResponse
        {
            Disclaimer = DraftPolicyPackRuleResponse.DefaultDisclaimer,
            DraftRuleJson = draftJson.Trim()
        };
    }
}
