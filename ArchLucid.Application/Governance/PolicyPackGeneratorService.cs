using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Governance;

public sealed class PolicyPackGeneratorService(
    IAgentCompletionClient completionClient,
    ICuratedRulesDocumentValidationService curatedRulesDocumentValidationService) : IPolicyPackGeneratorService
{
    private const string CuratedRulesDocumentKind = "archlucid.policyPack.curatedRules.v1";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ICuratedRulesDocumentValidationService _curatedRulesDocumentValidationService =
        curatedRulesDocumentValidationService
        ?? throw new ArgumentNullException(nameof(curatedRulesDocumentValidationService));

    public async Task<GeneratePolicyPackResponse> GenerateAsync(
        GeneratePolicyPackRequest input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        string prompt = input.Prompt.Trim();

        if (string.IsNullOrWhiteSpace(prompt))
            throw new ArgumentException("Prompt is required.", nameof(input));

        string fewShot = PolicyPackDraftFewShotExamples.BuildFewShotJson();
        string ruleSchema = PolicyPackDraftFewShotExamples.BuildSchemaDescription();
        string documentSchema = BuildCuratedDocumentSchemaDescription();

        const string systemPrompt =
            "You are a cloud governance expert. Based on operator intent, draft a valid ArchLucid "
            + "CuratedRulesDocument JSON object. Return ONLY the document JSON — no markdown fences.";

        string userPrompt =
            "Document schema:\n" +
            documentSchema +
            "\n\nRule object schema (each entry in rules[]):\n" +
            ruleSchema +
            "\n\nExample rule objects:\n" +
            fewShot +
            "\n\nOperator intent:\n" +
            prompt;

        string responseJson = await _completionClient.CompleteJsonAsync(
            systemPrompt,
            userPrompt,
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        JsonObject document = ParseAndNormalize(responseJson.Trim(), prompt);

        CuratedRulesDocumentValidationResult validation = _curatedRulesDocumentValidationService.Validate(document);

        if (!validation.IsValid)
            throw new CuratedRulesDocumentValidationException(validation.Errors.ToList());

        return new GeneratePolicyPackResponse
        {
            Disclaimer = DraftPolicyPackRuleResponse.DefaultDisclaimer,
            CuratedRulesDocumentJson = document.ToJsonString(JsonOptions),
            ValidationWarnings = validation.Warnings.ToList(),
            RequiresHumanReview = true,
        };
    }

    private static string BuildCuratedDocumentSchemaDescription()
    {
        return """
               {
                 "schemaVersion": 1,
                 "kind": "archlucid.policyPack.curatedRules.v1",
                 "pack": {
                   "name": "string",
                   "description": "string",
                   "version": "1.0.0",
                   "category": "General|Security|Compliance|Reliability",
                   "isDefault": false,
                   "suggestedPackType": "ProjectCustom",
                   "policyPackContentDocumentPath": ""
                 },
                 "rules": [ { /* rule objects — include 1-5 rules matching intent */ } ]
               }
               """;
    }

    private static JsonObject ParseAndNormalize(string responseJson, string prompt)
    {
        JsonNode? root = JsonNode.Parse(responseJson);

        if (root is not JsonObject document)
            throw new InvalidOperationException("Policy pack generation response was empty.");

        document["schemaVersion"] = 1;
        document["kind"] = CuratedRulesDocumentKind;

        JsonObject pack = document["pack"] as JsonObject ?? new JsonObject();
        document["pack"] = pack;

        JsonArray rules = document["rules"] as JsonArray ?? new JsonArray();
        document["rules"] = rules;

        for (int index = rules.Count - 1; index >= 0; index--)
        {
            if (rules[index] is not JsonObject rule)
            {
                rules.RemoveAt(index);
                continue;
            }

            string? id = rule["id"]?.GetValue<string>()?.Trim();

            if (string.IsNullOrWhiteSpace(id))
            {
                rules.RemoveAt(index);
                continue;
            }

            rule["id"] = id;

            if (string.IsNullOrWhiteSpace(rule["severity"]?.GetValue<string>()))
                rule["severity"] = "Medium";

            if (rule["evidenceHints"] is not JsonArray)
                rule["evidenceHints"] = new JsonArray();

            if (rule["frameworkMappings"] is not JsonArray)
                rule["frameworkMappings"] = new JsonArray();
        }

        if (rules.Count == 0)
            throw new InvalidOperationException("Policy pack generation produced no valid rules.");

        if (string.IsNullOrWhiteSpace(pack["name"]?.GetValue<string>()))
            pack["name"] = DerivePackName(prompt);

        if (string.IsNullOrWhiteSpace(pack["description"]?.GetValue<string>()))
            pack["description"] = prompt.Length > 240 ? prompt[..240] : prompt;

        if (string.IsNullOrWhiteSpace(pack["version"]?.GetValue<string>()))
            pack["version"] = "1.0.0";

        if (string.IsNullOrWhiteSpace(pack["category"]?.GetValue<string>()))
            pack["category"] = "General";

        if (string.IsNullOrWhiteSpace(pack["suggestedPackType"]?.GetValue<string>()))
            pack["suggestedPackType"] = "ProjectCustom";

        if (pack["isDefault"] is null)
            pack["isDefault"] = false;

        if (pack["policyPackContentDocumentPath"] is null)
            pack["policyPackContentDocumentPath"] = string.Empty;

        return document;
    }

    private static string DerivePackName(string prompt)
    {
        string[] tokens = prompt
            .Split([' ', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (tokens.Length == 0)
            return "Generated policy pack";

        int take = Math.Min(4, tokens.Length);

        return string.Join(' ', tokens.Take(take));
    }
}
