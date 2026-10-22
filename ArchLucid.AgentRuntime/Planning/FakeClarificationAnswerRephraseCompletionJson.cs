using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.AgentRuntime.Planning;

/// <summary>
///     Deterministic JSON completions for clarification answer rephrase when LLMs are offline (simulator / fake client).
/// </summary>
public static class FakeClarificationAnswerRephraseCompletionJson
{
    /// <summary>Builds a valid clarification-rephrase response for <see cref="Application.Planning.ClarificationAnswerRephraseService" /> parsing.</summary>
    public static string Build(string userPrompt)
    {
        JsonArray answers = new();

        foreach (ClarificationRephrasePromptItem item in ParseItems(userPrompt))
        {
            string? rephrased = TryBuildRephrasedAnswer(item.QuestionKey, item.QuestionPrompt, item.ExtractedAnswer);

            if (rephrased is null)
                continue;

            answers.Add(new JsonObject
            {
                ["questionKey"] = item.QuestionKey,
                ["rephrasedAnswer"] = rephrased,
            });
        }

        JsonObject root = new()
        {
            ["answers"] = answers,
        };

        return root.ToJsonString(new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    private static IEnumerable<ClarificationRephrasePromptItem> ParseItems(string userPrompt)
    {
        string[] blocks = userPrompt.Split("Question ", StringSplitOptions.RemoveEmptyEntries);

        foreach (string block in blocks)
        {
            string questionKey = ExtractLineValue(block, "questionKey:");
            string questionPrompt = ExtractLineValue(block, "questionPrompt:");
            string extractedAnswer = ExtractMultilineValue(block, "extractedAnswer:");

            if (questionKey.Length == 0 || extractedAnswer.Length == 0)
                continue;

            yield return new ClarificationRephrasePromptItem(questionKey, questionPrompt, extractedAnswer);
        }
    }

    private static string ExtractLineValue(string block, string label)
    {
        foreach (string line in block.Split('\n'))
        {
            ReadOnlySpan<char> span = line.AsSpan().Trim();

            if (!span.StartsWith(label, StringComparison.OrdinalIgnoreCase))
                continue;

            return span.Length > label.Length ? span[label.Length..].Trim().ToString() : string.Empty;
        }

        return string.Empty;
    }

    private static string ExtractMultilineValue(string block, string label)
    {
        int labelIndex = block.IndexOf(label, StringComparison.OrdinalIgnoreCase);

        if (labelIndex < 0)
            return string.Empty;

        StringBuilder builder = new();
        bool started = false;

        foreach (string line in block[labelIndex..].Split('\n'))
        {
            if (!started)
            {
                int valueStart = line.IndexOf(label, StringComparison.OrdinalIgnoreCase);

                if (valueStart < 0)
                    continue;

                string firstLine = line[(valueStart + label.Length)..].Trim();

                if (firstLine.Length > 0)
                    builder.AppendLine(firstLine);

                started = true;
                continue;
            }

            if (line.TrimStart().StartsWith("questionKey:", StringComparison.OrdinalIgnoreCase))
                break;

            builder.AppendLine(line);
        }

        return builder.ToString().Trim();
    }

    private static string? TryBuildRephrasedAnswer(string questionKey, string questionPrompt, string extractedAnswer)
    {
        if (InferredClarificationAnswerQualitySimulator.IsDumpLike(extractedAnswer))
        {
            string? synthesized = TrySynthesizeFromDump(extractedAnswer, questionPrompt);

            if (synthesized is not null)
                return synthesized;

            return null;
        }

        if (extractedAnswer.StartsWith("Evidence excerpt", StringComparison.OrdinalIgnoreCase))
            return TryAnswerFromEvidenceExcerpt(extractedAnswer, questionKey, questionPrompt);

        if (extractedAnswer.EndsWith('.') || extractedAnswer.EndsWith('!') || extractedAnswer.EndsWith('?'))
            return extractedAnswer;

        return $"{extractedAnswer}.";
    }

    private static string? TrySynthesizeFromDump(string extractedAnswer, string questionPrompt)
    {
        if (questionPrompt.Contains("other kinds of users", StringComparison.OrdinalIgnoreCase)
            && extractedAnswer.Contains("Operators", StringComparison.OrdinalIgnoreCase))
        {
            return
                "Yes. Operators and architects use the Architect workspace in the browser. " +
                "Sponsors and evaluators use the same UI. CLI and CI automation call the API over HTTPS.";
        }

        return null;
    }

    private static string? TryAnswerFromEvidenceExcerpt(string extractedAnswer, string questionKey, string questionPrompt)
    {
        string corpus = extractedAnswer;
        int newlineIndex = corpus.IndexOf('\n');

        if (newlineIndex >= 0 && newlineIndex < corpus.Length - 1)
            corpus = corpus[(newlineIndex + 1)..];

        if (questionKey.Contains("reliability", StringComparison.Ordinal)
            && corpus.Contains("RTO", StringComparison.OrdinalIgnoreCase))
        {
            return "Recovery expectations include recording actual RTO against targets during failover drills.";
        }

        if (questionKey.Contains("security", StringComparison.Ordinal)
            && (corpus.Contains("Entra", StringComparison.OrdinalIgnoreCase)
                || corpus.Contains("trust edge", StringComparison.OrdinalIgnoreCase)))
        {
            return "Trust edges include Entra ID or JWT authentication and private networking where required.";
        }

        if (questionKey.Contains("operations", StringComparison.Ordinal)
            && corpus.Contains("observability", StringComparison.OrdinalIgnoreCase))
        {
            return "Day-to-day operations expect observability and incident response through centralized monitoring.";
        }

        if (questionKey.Contains("cost", StringComparison.Ordinal)
            && corpus.Contains("FinOps", StringComparison.OrdinalIgnoreCase))
        {
            return "Cost constraints include FinOps and capacity drivers with budget gates on spend.";
        }

        if (questionPrompt.Contains("other kinds of users", StringComparison.OrdinalIgnoreCase))
            return TrySynthesizeFromDump(corpus, questionPrompt);

        return null;
    }

    private sealed record ClarificationRephrasePromptItem(string QuestionKey, string QuestionPrompt, string ExtractedAnswer);
}
