using System.Text.Json;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

/// <summary>Reads optional drift token caps from <c>golden-cohort/budget.config.json</c> copied beside cohort.json.</summary>
internal static class GoldenCohortDriftBudgetReader
{
    internal static int ResolveMaxTotalPromptCompletionTokens(int fallback)
    {
        string path = Path.Combine(AppContext.BaseDirectory, "golden-cohort", "budget.config.json");

        if (!File.Exists(path))
            return fallback;

        try
        {
            using FileStream stream = File.OpenRead(path);
            using JsonDocument doc = JsonDocument.Parse(stream);

            if (!doc.RootElement.TryGetProperty("driftRunMaxTotalPromptCompletionTokens", out JsonElement capEl))
                return fallback;

            return capEl.TryGetInt32(out int parsed) && parsed > 0 ? parsed : fallback;
        }
        catch
        {
            return fallback;
        }
    }
}
