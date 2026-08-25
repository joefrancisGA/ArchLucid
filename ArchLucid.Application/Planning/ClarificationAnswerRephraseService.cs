using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Rewrites document-extracted clarification snippets into direct, human-sounding operator answers.
///     Falls back to the extracted text when the model is unavailable or returns unusable output.
/// </summary>
public sealed class ClarificationAnswerRephraseService(
    IAgentCompletionClient completionClient,
    ILogger<ClarificationAnswerRephraseService> logger) : IClarificationAnswerRephraseService
{
    private const int MaxAnswerChars = 480;

    private const string RephraseSystemPrompt =
        "You rewrite architecture intake clarification answers so they sound like a human operator " +
        "answered each question directly. " +
        "Use ONLY facts already present in the extracted answer for that question. " +
        "Do not add, remove, rename, or soften actors, systems, regulations, numbers, SLAs, or commitments. " +
        "When the question is yes/no, answer it directly first, then add supporting detail if helpful. " +
        "Write 1–3 concise sentences in plain English with sentence case. " +
        "Do not quote the source document or use bullet lists. " +
        "Respond with a single JSON object only (no markdown fences), key: answers (array). " +
        "Each array item must have questionKey (string) and rephrasedAnswer (string). " +
        "Include one item for every question in the user prompt.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                  ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ILogger<ClarificationAnswerRephraseService> _logger = logger
        ?? throw new ArgumentNullException(nameof(logger));

    public async Task<RephraseClarificationAnswersResponse> RephraseAsync(
        RephraseClarificationAnswersInput input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (input.Items.Count == 0)
            return new RephraseClarificationAnswersResponse();

        Dictionary<string, string> fallback = BuildFallbackAnswers(input.Items);

        try
        {
            string userPrompt = BuildUserPrompt(input.Items);

            string responseJson = await _completionClient.CompleteJsonAsync(
                RephraseSystemPrompt,
                userPrompt,
                maxTokens: 900,
                temperature: 0.2f,
                cancellationToken: cancellationToken);

            RephraseResponseShape? shape = JsonSerializer.Deserialize<RephraseResponseShape>(responseJson, JsonOptions);

            if (shape?.Answers is null || shape.Answers.Count == 0)
            {
                _logger.LogWarning("Clarification rephrase returned empty answers; using extracted text.");

                return new RephraseClarificationAnswersResponse { RephrasedAnswers = fallback };
            }

            Dictionary<string, string> merged = new(fallback, StringComparer.Ordinal);

            foreach (RephraseAnswerShape answer in shape.Answers)
            {
                if (string.IsNullOrWhiteSpace(answer.QuestionKey) || string.IsNullOrWhiteSpace(answer.RephrasedAnswer))
                    continue;

                ClarificationAnswerRephraseItem? item = input.Items.FirstOrDefault(
                    candidate => string.Equals(candidate.QuestionKey, answer.QuestionKey, StringComparison.Ordinal));

                if (item is null)
                    continue;

                string trimmed = CapAnswer(answer.RephrasedAnswer.Trim());

                if (!IsUsableRephrase(item.ExtractedAnswer, trimmed))
                    continue;

                merged[item.QuestionKey] = trimmed;
            }

            return new RephraseClarificationAnswersResponse { RephrasedAnswers = merged };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Clarification rephrase failed; using extracted text.");

            return new RephraseClarificationAnswersResponse { RephrasedAnswers = fallback };
        }
    }

    internal static string BuildUserPrompt(IReadOnlyList<ClarificationAnswerRephraseItem> items)
    {
        StringBuilder builder = new();
        builder.AppendLine("Rephrase each extracted answer below into a direct response to its question.");
        builder.AppendLine();

        for (int index = 0; index < items.Count; index++)
        {
            ClarificationAnswerRephraseItem item = items[index];

            builder.AppendLine($"Question {index + 1}:");
            builder.AppendLine($"questionKey: {item.QuestionKey}");
            builder.AppendLine($"questionPrompt: {item.QuestionPrompt.Trim()}");
            builder.AppendLine($"extractedAnswer: {item.ExtractedAnswer.Trim()}");
            builder.AppendLine();
        }

        return builder.ToString().TrimEnd();
    }

    internal static bool IsUsableRephrase(string extractedAnswer, string rephrasedAnswer)
    {
        if (rephrasedAnswer.Length < 3)
            return false;

        if (rephrasedAnswer.Length > MaxAnswerChars)
            return false;

        if (rephrasedAnswer.EndsWith("...", StringComparison.Ordinal))
            return false;

        int letters = rephrasedAnswer.Count(char.IsLetter);

        if (letters < 3)
            return false;

        double letterRatio = (double)letters / rephrasedAnswer.Length;

        if (letterRatio < 0.35)
            return false;

        // Guard against answers that drop every digit from a numeric extracted answer.
        bool extractedHasDigit = extractedAnswer.Any(char.IsDigit);
        bool rephrasedHasDigit = rephrasedAnswer.Any(char.IsDigit);

        if (extractedHasDigit && !rephrasedHasDigit)
            return false;

        return true;
    }

    private static Dictionary<string, string> BuildFallbackAnswers(IReadOnlyList<ClarificationAnswerRephraseItem> items)
    {
        Dictionary<string, string> fallback = new(StringComparer.Ordinal);

        foreach (ClarificationAnswerRephraseItem item in items)
        {
            string trimmed = item.ExtractedAnswer.Trim();

            if (trimmed.Length > 0)
                fallback[item.QuestionKey] = trimmed;
        }

        return fallback;
    }

    private static string CapAnswer(string answer)
    {
        if (answer.Length <= MaxAnswerChars)
            return answer;

        string slice = answer[..MaxAnswerChars];
        int lastSpace = slice.LastIndexOf(' ');

        if (lastSpace > MaxAnswerChars * 0.6)
            return slice[..lastSpace].TrimEnd();

        return slice.TrimEnd();
    }

    private sealed class RephraseResponseShape
    {
        [JsonPropertyName("answers")]
        public List<RephraseAnswerShape>? Answers
        {
            get;
            init;
        }
    }

    private sealed class RephraseAnswerShape
    {
        [JsonPropertyName("questionKey")]
        public string? QuestionKey
        {
            get;
            init;
        }

        [JsonPropertyName("rephrasedAnswer")]
        public string? RephrasedAnswer
        {
            get;
            init;
        }
    }
}
