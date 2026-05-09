using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Maps persisted authority finding JSON to coarse ticket fields (no new projection schema).</summary>
internal static class ItsmFindingAuthorityPayloadMapper
{
    private static readonly JsonSerializerOptions SerializerOptions = new() { PropertyNameCaseInsensitive = true };

    public static FindingSeverity TryGetSeverity(JsonElement? typedPayload, FindingSeverity @default = FindingSeverity.Info)
    {
        if (typedPayload is null || typedPayload.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return @default;

        try
        {
            ArchitectureFinding? parsed = JsonSerializer.Deserialize<ArchitectureFinding>(typedPayload.Value.GetRawText(), SerializerOptions);

            return parsed?.Severity ?? @default;
        }
        catch (JsonException)
        {
            return @default;
        }
    }

    public static (string Summary, string Description) BuildSummaryAndDescription(
        string findingId,
        Guid runId,
        JsonElement? typedPayload,
        string? decisionRuleName,
        IReadOnlyList<string> recommendedActions)
    {
        string summary = $"ArchLucid finding {findingId}";
        string description =
            $"ArchLucid correlation:{Environment.NewLine}" +
            $"- findingId: {findingId}{Environment.NewLine}" +
            $"- runId: {runId:N}{Environment.NewLine}" +
            $"Relative paths (no secrets): v1/architecture/run/{runId:N}/findings/{findingId}/evidence-chain";

        if (typedPayload is null || typedPayload.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return (summary, AppendDecisionAndActions(description, decisionRuleName, recommendedActions));

        try
        {
            ArchitectureFinding? parsed = JsonSerializer.Deserialize<ArchitectureFinding>(typedPayload.Value.GetRawText(), SerializerOptions);

            if (parsed is null)
                return (summary, AppendDecisionAndActions(description, decisionRuleName, recommendedActions));

            string msg = parsed.Message.Trim();

            if (msg.Length > 0)
                summary = Truncate(msg, 240);

            string body = description + Environment.NewLine + Environment.NewLine + "Message:" + Environment.NewLine + msg;

            string? reasoning = parsed.ReasoningTrace?.Trim();

            if (!string.IsNullOrWhiteSpace(reasoning))
                body += Environment.NewLine + Environment.NewLine + "Reasoning:" + Environment.NewLine + reasoning;

            body = AppendDecisionAndActions(body, decisionRuleName ?? parsed.Category.Trim(), recommendedActions);

            return (Truncate(summary, 240), body);
        }
        catch (JsonException)
        {
            return (summary, AppendDecisionAndActions(description, decisionRuleName, recommendedActions));
        }
    }

    private static string AppendDecisionAndActions(
        string description,
        string? decisionRuleName,
        IReadOnlyList<string> recommendedActions)
    {
        if (!string.IsNullOrWhiteSpace(decisionRuleName))
            description += Environment.NewLine + Environment.NewLine + "Decision / category:" + Environment.NewLine + decisionRuleName.Trim();

        if (recommendedActions.Count is 0) return description;

        description += Environment.NewLine + Environment.NewLine + "Recommended actions:";

        return recommendedActions.Where(action => !string.IsNullOrWhiteSpace(action)).Aggregate(description, (current, action) => current + (Environment.NewLine + "- " + action.Trim()));
    }

    private static string Truncate(string s, int max)
    {
        return s.Length <= max ? s : s[..max];
    }
}
