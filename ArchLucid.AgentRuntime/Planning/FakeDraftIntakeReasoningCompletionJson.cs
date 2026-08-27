using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.AgentRuntime.Planning;

/// <summary>
///     Deterministic JSON completions for draft intake reasoning when LLMs are offline (simulator / fake client).
/// </summary>
public static class FakeDraftIntakeReasoningCompletionJson
{
    /// <summary>Builds a valid intake-reasoning response for draft intake reasoning parsing.</summary>
    public static string Build(string userPrompt)
    {
        string latestMessage = ExtractSection(userPrompt, "Latest message:");
        string systemName = ExtractJsonStringField(userPrompt, "systemName");
        string businessOutcome = ExtractJsonStringField(userPrompt, "businessOutcome");
        string freeTextIntent = ExtractJsonStringField(userPrompt, "freeTextIntent");
        List<string> constraints = ExtractJsonStringArray(userPrompt, "constraints");
        List<string> assumptions = ExtractJsonStringArray(userPrompt, "assumptions");

        StringBuilder answer = new();

        if (latestMessage.Length > 0)
        {
            answer.Append("You asked: ").Append(latestMessage.Trim()).AppendLine().AppendLine();
        }

        if (systemName.Length > 0)
            answer.Append("System: ").Append(systemName).AppendLine();

        if (businessOutcome.Length > 0)
            answer.Append("Business outcome: ").Append(businessOutcome).AppendLine();

        answer.AppendLine();
        answer.AppendLine("Gaps and risks to confirm before starting the architecture review:");

        if (businessOutcome.Length < 20)
            answer.AppendLine("- Business outcome is still vague — spell out measurable success (latency, cost, risk reduction, or adoption).");

        if (constraints.Count == 0)
            answer.AppendLine("- No explicit constraints captured yet — list hard limits (data residency, tenancy, RTO/RPO, compliance).");

        if (assumptions.Count == 0)
            answer.AppendLine("- Assumptions are empty — state what you are taking for granted (identity model, network boundaries, data classification).");

        if (freeTextIntent.Length > 0 && freeTextIntent.Length < 120)
            answer.AppendLine("- Architecture overview is thin — add primary actors, integrations, and failure/recovery expectations.");

        answer.AppendLine("- Validate actor trust boundaries and machine-to-machine auth before deep design.");
        answer.AppendLine("- Confirm whether pilot scope matches production non-functional targets (availability, RTO/RPO).");

        answer.AppendLine();
        answer.Append(
            "(Simulator mode — deterministic intake notes from draft context. " +
            "Connect a live LLM deployment for interactive Socratic follow-up.)");

        JsonObject root = new()
        {
            ["answer"] = answer.ToString().Trim(),
        };

        return root.ToJsonString(new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    private static string ExtractSection(string userPrompt, string sectionHeader)
    {
        int headerIndex = userPrompt.IndexOf(sectionHeader, StringComparison.Ordinal);

        if (headerIndex < 0)
            return string.Empty;

        int contentStart = headerIndex + sectionHeader.Length;

        if (contentStart < userPrompt.Length && userPrompt[contentStart] == '\n')
            contentStart++;

        return userPrompt[contentStart..].Trim();
    }

    private static string ExtractJsonStringField(string userPrompt, string fieldName)
    {
        string marker = $"\"{fieldName}\":";
        int index = userPrompt.IndexOf(marker, StringComparison.Ordinal);

        if (index < 0)
            return string.Empty;

        int valueStart = index + marker.Length;

        while (valueStart < userPrompt.Length && char.IsWhiteSpace(userPrompt[valueStart]))
            valueStart++;

        if (valueStart >= userPrompt.Length || userPrompt[valueStart] != '"')
            return string.Empty;

        int closingQuote = userPrompt.IndexOf('"', valueStart + 1);

        if (closingQuote < 0)
            return string.Empty;

        return userPrompt[(valueStart + 1)..closingQuote];
    }

    private static List<string> ExtractJsonStringArray(string userPrompt, string arrayName)
    {
        string marker = $"\"{arrayName}\":";
        int index = userPrompt.IndexOf(marker, StringComparison.Ordinal);

        if (index < 0)
            return [];

        int arrayStart = userPrompt.IndexOf('[', index);

        if (arrayStart < 0)
            return [];

        int arrayEnd = userPrompt.IndexOf(']', arrayStart);

        if (arrayEnd < 0)
            return [];

        string arrayBody = userPrompt[(arrayStart + 1)..arrayEnd];
        List<string> items = [];

        foreach (string segment in arrayBody.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            string trimmed = segment.Trim();

            if (!trimmed.StartsWith("\"", StringComparison.Ordinal) || !trimmed.EndsWith("\"", StringComparison.Ordinal))
                continue;

            string item = trimmed[1..^1];

            if (item.Length > 0)
                items.Add(item);
        }

        return items;
    }
}
