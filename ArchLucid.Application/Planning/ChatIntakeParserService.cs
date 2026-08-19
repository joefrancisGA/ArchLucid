using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Planning;

public sealed class ChatIntakeParserService(IAgentCompletionClient completionClient) : IChatIntakeParserService
{
    // Matches ArchitectureRequestEvidenceSufficiency.MinDescriptionLengthForNoneOnly (Api validators).
    private const int MinDescriptionLengthForNoneOnly = 50;
    private const string ChatIntakeSystemPrompt =
        "You are an enterprise architecture intake assistant. " +
        "Given unstructured text, extract a structured architecture review request. " +
        "Return ONLY valid JSON with keys: " +
        "description (string, min 10 chars), systemName (string, PascalCase slug), environment (string, e.g. prod/staging/dev), " +
        "cloudProvider (\"None\", \"Azure\", \"Aws\", or \"Gcp\"), constraints (string[]), requiredCapabilities (string[]), " +
        "assumptions (string[]), inlineRequirements (string[]), policyReferences (string[]), " +
        "topologyHints (string[]), securityBaselineHints (string[]). " +
        "Use cloudProvider Azure only when the text clearly targets Microsoft Azure. " +
        "Use Aws when the text clearly targets Amazon Web Services. " +
        "Use Gcp when the text clearly targets Google Cloud Platform. Otherwise use None. " +
        "Be specific; do not invent evidence documents or IaC.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<ArchitectureRequest> ParseAsync(ChatIntakeRequest input, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        string rawText = input.RawText.Trim();

        if (string.IsNullOrWhiteSpace(rawText))
            throw new ArgumentException("RawText is required.", nameof(input));

        string responseJson = await _completionClient.CompleteJsonAsync(
            ChatIntakeSystemPrompt,
            rawText,
            maxTokens: null,
            temperature: null,
            cancellationToken: cancellationToken);

        ChatIntakeResponseShape? shape = JsonSerializer.Deserialize<ChatIntakeResponseShape>(responseJson, JsonOptions);

        if (shape is null)
            throw new InvalidOperationException("Chat intake response was empty.");

        return Normalize(rawText, shape);
    }

    private static ArchitectureRequest Normalize(string rawText, ChatIntakeResponseShape shape)
    {
        string description = TrimToMax(shape.Description, ArchitectureRequestFieldLimits.MaxDescriptionLength);

        if (description.Length < ArchitectureRequestFieldLimits.MinDescriptionLength)
            description = TrimToMax(rawText, ArchitectureRequestFieldLimits.MaxDescriptionLength);

        if (description.Length < MinDescriptionLengthForNoneOnly
            && ParseCloudProvider(shape.CloudProvider) == CloudProvider.None
            && rawText.Length >= MinDescriptionLengthForNoneOnly)
        {
            description = TrimToMax(rawText, ArchitectureRequestFieldLimits.MaxDescriptionLength);
        }

        string systemName = TrimToMax(shape.SystemName, 200);

        if (string.IsNullOrWhiteSpace(systemName))
            systemName = DeriveSystemName(description);

        string environment = TrimToMax(shape.Environment, 50);

        if (string.IsNullOrWhiteSpace(environment))
            environment = "prod";

        return new ArchitectureRequest
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = description,
            SystemName = systemName,
            Environment = environment,
            CloudProvider = ParseCloudProvider(shape.CloudProvider),
            Constraints = NormalizeStringList(shape.Constraints, 50, 500),
            RequiredCapabilities = NormalizeStringList(shape.RequiredCapabilities, 50, 500),
            Assumptions = NormalizeStringList(shape.Assumptions, 50, 500),
            InlineRequirements = NormalizeStringList(
                shape.InlineRequirements,
                100,
                ArchitectureRequestFieldLimits.MaxInlineRequirementLength),
            PolicyReferences = NormalizeStringList(shape.PolicyReferences, 100, 500),
            TopologyHints = NormalizeStringList(shape.TopologyHints, 100, 2000),
            SecurityBaselineHints = NormalizeStringList(shape.SecurityBaselineHints, 100, 2000),
        };
    }

    private static CloudProvider ParseCloudProvider(string? value)
    {

        if (string.IsNullOrWhiteSpace(value))
            return CloudProvider.None;

        return Enum.TryParse(value.Trim(), ignoreCase: true, out CloudProvider parsed)
            ? parsed
            : CloudProvider.None;
    }

    private static string DeriveSystemName(string description)
    {
        string[] tokens = description
            .Split([' ', '\n', '\r', '\t', '-', '_'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (tokens.Length == 0)
            return "ImportedSystem";

        string candidate = tokens[0];

        if (candidate.Length < 2)
            candidate = "ImportedSystem";

        return TrimToMax(candidate, 200);
    }

    private static List<string> NormalizeStringList(string[]? values, int maxItems, int maxItemLength)
    {

        if (values is null || values.Length == 0)
            return [];

        return values
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(value => TrimToMax(value.Trim(), maxItemLength))
            .Where(static value => value.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxItems)
            .ToList();
    }

    private static string TrimToMax(string? value, int maxLength)
    {

        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string trimmed = value.Trim();

        if (trimmed.Length <= maxLength)
            return trimmed;

        return trimmed[..maxLength];
    }

    private sealed class ChatIntakeResponseShape
    {
        [JsonPropertyName("description")]
        public string? Description
        {
            get;
            init;
        }

        [JsonPropertyName("systemName")]
        public string? SystemName
        {
            get;
            init;
        }

        [JsonPropertyName("environment")]
        public string? Environment
        {
            get;
            init;
        }

        [JsonPropertyName("cloudProvider")]
        public string? CloudProvider
        {
            get;
            init;
        }

        [JsonPropertyName("constraints")]
        public string[]? Constraints
        {
            get;
            init;
        }

        [JsonPropertyName("requiredCapabilities")]
        public string[]? RequiredCapabilities
        {
            get;
            init;
        }

        [JsonPropertyName("assumptions")]
        public string[]? Assumptions
        {
            get;
            init;
        }

        [JsonPropertyName("inlineRequirements")]
        public string[]? InlineRequirements
        {
            get;
            init;
        }

        [JsonPropertyName("policyReferences")]
        public string[]? PolicyReferences
        {
            get;
            init;
        }

        [JsonPropertyName("topologyHints")]
        public string[]? TopologyHints
        {
            get;
            init;
        }

        [JsonPropertyName("securityBaselineHints")]
        public string[]? SecurityBaselineHints
        {
            get;
            init;
        }
    }
}
