using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Planning;

/// <summary>
/// Generates on-demand plain-English rationales for structured-brief suggestion chips.
/// Results are cached in-process by suggestion text and source hash so repeat clicks are cheap.
/// </summary>
public sealed class StructuredBriefSuggestionExplainService(
    IAgentCompletionClient completionClient) : IStructuredBriefSuggestionExplainService
{
    private const int MaxExplanationWords = 120;

    private const string ExplainSystemPrompt =
        "You are an enterprise architecture intake assistant. " +
        "Explain why a single suggested constraint, assumption, or required capability was recommended " +
        "from the operator's architecture overview. " +
        "Audience: a frontend developer with about two years of experience — define any technical term in the sentence. " +
        "Write 80–120 words in plain English. Sentence case. " +
        "Say what confirming the suggestion tells the review to treat as fact, and what denying it means. " +
        "If the overview only weakly supports the suggestion, say that honestly. " +
        "Do not invent regulation citations or claim legal or compliance authority. " +
        "Do not use product SKU names or internal control IDs. " +
        "Respond with a single JSON object only (no markdown fences), key: explanation (string).";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(24);

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                  ?? throw new ArgumentNullException(nameof(completionClient));

    // Shared across requests in this process — keyed by tenant-agnostic content hash only (no PII in key).
    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new();

    public async Task<ExplainStructuredBriefSuggestionResponse> ExplainAsync(
        ExplainStructuredBriefSuggestionInput input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (string.IsNullOrWhiteSpace(input.SourceText))
            throw new ArgumentException("SourceText is required.", nameof(input));

        if (string.IsNullOrWhiteSpace(input.SuggestionText))
            throw new ArgumentException("SuggestionText is required.", nameof(input));

        string trimmedSource = input.SourceText.Trim();
        string trimmedSuggestion = input.SuggestionText.Trim();
        string cacheKey = BuildCacheKey(input.SuggestionKind, trimmedSuggestion, trimmedSource);

        if (_cache.TryGetValue(cacheKey, out CacheEntry? cached) && !cached.IsExpired)
            return new ExplainStructuredBriefSuggestionResponse { Explanation = cached.Explanation };

        string userPrompt = BuildUserPrompt(input.SuggestionKind, trimmedSuggestion, trimmedSource);

        string responseJson = await _completionClient.CompleteJsonAsync(
            ExplainSystemPrompt,
            userPrompt,
            maxTokens: 400,
            temperature: 0.2f,
            cancellationToken: cancellationToken);

        ExplainResponseShape? shape = JsonSerializer.Deserialize<ExplainResponseShape>(responseJson, JsonOptions);

        if (shape is null || string.IsNullOrWhiteSpace(shape.Explanation))
            throw new InvalidOperationException("Explain response was empty.");

        string explanation = CapWordCount(shape.Explanation.Trim());

        _cache[cacheKey] = new CacheEntry(explanation, TimeProvider.System.GetUtcNow().Add(CacheTtl));

        return new ExplainStructuredBriefSuggestionResponse { Explanation = explanation };
    }

    internal static string BuildCacheKey(
        StructuredBriefSuggestionKind kind,
        string suggestionText,
        string sourceText)
    {
        string payload = $"{kind}|{suggestionText.ToLowerInvariant()}|{sourceText}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }

    private static string BuildUserPrompt(
        StructuredBriefSuggestionKind kind,
        string suggestionText,
        string sourceText)
    {
        string kindLabel = kind switch
        {
            StructuredBriefSuggestionKind.Constraint => "constraint",
            StructuredBriefSuggestionKind.Assumption => "assumption",
            StructuredBriefSuggestionKind.RequiredCapability => "required capability",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown suggestion kind."),
        };

        return $"""
                Suggestion kind: {kindLabel}
                Suggested text: {suggestionText}

                Architecture overview and context:
                {sourceText}
                """;
    }

    private static string CapWordCount(string text)
    {
        string[] words = text.Split((char[]?)[' ', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries);

        if (words.Length <= MaxExplanationWords)
            return text;

        return string.Join(' ', words.Take(MaxExplanationWords)) + "…";
    }

    private sealed class ExplainResponseShape
    {
        [JsonPropertyName("explanation")]
        public string? Explanation
        {
            get;
            init;
        }
    }

    private sealed record CacheEntry(string Explanation, DateTimeOffset ExpiresAt)
    {
        public bool IsExpired => TimeProvider.System.GetUtcNow() >= ExpiresAt;
    }
}
