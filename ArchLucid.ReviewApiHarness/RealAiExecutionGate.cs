using System.Text.Json;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Fails closed unless the run used live model execution (not Simulator / Fallback).</summary>
public static class RealAiExecutionGate
{
    public static ResponseValidationResult Evaluate(
        string? structuralExecutionMode,
        bool realModeFellBackToSimulator,
        long totalLlmTokens,
        bool requireNonZeroLlmTokens = true)
    {
        List<string> errors = [];

        if (string.IsNullOrWhiteSpace(structuralExecutionMode))
        {
            errors.Add("structuralExecutionMode is missing — cannot prove real AI execution.");
        }
        else if (!string.Equals(structuralExecutionMode, "Real", StringComparison.OrdinalIgnoreCase) &&
                 !string.Equals(structuralExecutionMode, "1", StringComparison.Ordinal))
        {
            errors.Add(
                $"structuralExecutionMode='{structuralExecutionMode}' — harness requires Real (live model). " +
                "Simulator/Fallback/Mixed are rejected.");
        }

        if (realModeFellBackToSimulator)
            errors.Add("realModeFellBackToSimulator=true — run substituted simulator output; not real-AI evidence.");

        if (requireNonZeroLlmTokens && totalLlmTokens <= 0)
        {
            errors.Add(
                "Persisted LLM token totals are zero — expected non-zero prompt+completion tokens for real AI.");
        }

        return new ResponseValidationResult(errors.Count == 0, errors);
    }

    public static (string? Mode, bool FellBack, long Tokens) ReadFromRunDetail(JsonElement detail)
    {
        string? mode = null;
        bool fellBack = false;
        long tokens = 0;

        if (detail.TryGetProperty("run", out JsonElement run))
        {
            if (run.TryGetProperty("structuralExecutionMode", out JsonElement modeEl))
                mode = modeEl.ValueKind == JsonValueKind.Number
                    ? modeEl.GetInt32().ToString()
                    : modeEl.GetString();

            if (run.TryGetProperty("realModeFellBackToSimulator", out JsonElement fellBackEl) &&
                fellBackEl.ValueKind is JsonValueKind.True or JsonValueKind.False)
            {
                fellBack = fellBackEl.GetBoolean();
            }
        }

        if (detail.TryGetProperty("agentExecutionLlmCostEstimate", out JsonElement estimate) &&
            estimate.ValueKind == JsonValueKind.Object &&
            estimate.TryGetProperty("tokenCounts", out JsonElement counts) &&
            counts.ValueKind == JsonValueKind.Object)
        {
            tokens += ReadLong(counts, "prompt");
            tokens += ReadLong(counts, "completion");
            tokens += ReadLong(counts, "Prompt");
            tokens += ReadLong(counts, "Completion");
        }

        if (tokens <= 0 &&
            detail.TryGetProperty("results", out JsonElement results) &&
            results.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement result in results.EnumerateArray())
            {
                tokens += ReadLong(result, "promptTokens");
                tokens += ReadLong(result, "completionTokens");
                tokens += ReadLong(result, "PromptTokens");
                tokens += ReadLong(result, "CompletionTokens");
            }
        }

        return (mode, fellBack, tokens);
    }

    private static long ReadLong(JsonElement parent, string name)
    {
        if (!parent.TryGetProperty(name, out JsonElement value))
            return 0;

        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out long n))
            return n;

        if (value.ValueKind == JsonValueKind.String &&
            long.TryParse(value.GetString(), out long parsed))
        {
            return parsed;
        }

        return 0;
    }
}
