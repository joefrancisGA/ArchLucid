using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Planning;

/// <summary>
/// Generates on-demand plain-English rationales for structured-brief suggestion chips.
/// Results are cached in-process by suggestion text and source hash so repeat clicks are cheap.
/// </summary>
public sealed class StructuredBriefSuggestionExplainService(
    IAgentCompletionClient completionClient,
    ILogger<StructuredBriefSuggestionExplainService> logger) : IStructuredBriefSuggestionExplainService
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

    private readonly ILogger<StructuredBriefSuggestionExplainService> _logger = logger
        ?? throw new ArgumentNullException(nameof(logger));

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

        string? explanation = await TryLoadLlmExplanationAsync(
            input.SuggestionKind,
            trimmedSuggestion,
            trimmedSource,
            cancellationToken);

        if (string.IsNullOrWhiteSpace(explanation))
        {
            _logger.LogWarning(
                "Structured brief suggestion explain returned empty output; using deterministic fallback for kind {SuggestionKind}.",
                input.SuggestionKind);

            explanation = BuildDeterministicFallbackExplanation(input.SuggestionKind, trimmedSuggestion);
        }

        explanation = CapWordCount(explanation.Trim());

        _cache[cacheKey] = new CacheEntry(explanation, TimeProvider.System.GetUtcNow().Add(CacheTtl));

        return new ExplainStructuredBriefSuggestionResponse { Explanation = explanation };
    }

    private async Task<string?> TryLoadLlmExplanationAsync(
        StructuredBriefSuggestionKind kind,
        string suggestionText,
        string sourceText,
        CancellationToken cancellationToken)
    {
        try
        {
            string userPrompt = BuildUserPrompt(kind, suggestionText, sourceText);

            string responseJson = await _completionClient.CompleteJsonAsync(
                ExplainSystemPrompt,
                userPrompt,
                maxTokens: 400,
                temperature: 0.2f,
                cancellationToken: cancellationToken);

            if (string.IsNullOrWhiteSpace(responseJson))
                return null;

            string normalizedJson = NormalizeLlmJsonPayload(responseJson);
            ExplainResponseShape? shape = JsonSerializer.Deserialize<ExplainResponseShape>(normalizedJson, JsonOptions);

            if (shape is null || string.IsNullOrWhiteSpace(shape.Explanation))
                return null;

            return shape.Explanation.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Structured brief suggestion explain LLM call failed for kind {SuggestionKind}; using fallback.",
                kind);

            return null;
        }
    }

    internal static string BuildDeterministicFallbackExplanation(
        StructuredBriefSuggestionKind kind,
        string suggestionText)
    {
        string kindLabel = KindLabel(kind);

        return
            $"ArchLucid suggested this {kindLabel} from your architecture overview: \"{suggestionText}\". " +
            $"Confirming adds it to your confirmed {kindLabel} list so review engines treat it as stated scope. " +
            $"Denying removes the suggestion without recording it. " +
            "A detailed rationale could not be loaded right now — confirm or deny based on whether your overview supports it.";
    }

    internal static string NormalizeLlmJsonPayload(string raw)
    {
        string trimmed = raw.Trim();

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
            return trimmed;

        int firstNewline = trimmed.IndexOf('\n');

        if (firstNewline < 0)
            return trimmed;

        int contentStart = firstNewline + 1;
        int fenceEnd = trimmed.LastIndexOf("```", StringComparison.Ordinal);

        if (fenceEnd <= contentStart)
            return trimmed;

        return trimmed.Substring(contentStart, fenceEnd - contentStart).Trim();
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
        string kindLabel = KindLabel(kind);

        return $"""
                Suggestion kind: {kindLabel}
                Suggested text: {suggestionText}

                Architecture overview and context:
                {sourceText}
                """;
    }

    private static string KindLabel(StructuredBriefSuggestionKind kind)
    {
        return kind switch
        {
            StructuredBriefSuggestionKind.Constraint => "constraint",
            StructuredBriefSuggestionKind.Assumption => "assumption",
            StructuredBriefSuggestionKind.RequiredCapability => "required capability",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown suggestion kind."),
        };
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
