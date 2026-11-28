using System.Text.Json;

using ArchLucid.Contracts.Evolution;

namespace ArchLucid.Api.Models.Evolution;

internal static class EvolutionOutcomeParser
{
    internal const string SchemaV2 = "60R-v2";

    private static readonly JsonSerializerOptions ParseOptions = new(JsonSerializerDefaults.Web);

    internal static EvolutionSimulationRunWithEvaluationResponse ToRunWithEvaluation(
        EvolutionSimulationRunRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        TryParseV2(
            record.OutcomeJson,
            out EvaluationScoreResponse? evaluation,
            out string? explanationSummary,
            out string? schemaVersion);

        return new EvolutionSimulationRunWithEvaluationResponse
        {
            SimulationRunId = record.SimulationRunId,
            BaselineArchitectureRunId = record.BaselineArchitectureRunId,
            EvaluationMode = record.EvaluationMode,
            OutcomeJson = record.OutcomeJson,
            WarningsJson = record.WarningsJson,
            CompletedUtc = record.CompletedUtc,
            IsShadowOnly = record.IsShadowOnly,
            EvaluationScore = evaluation,
            EvaluationExplanationSummary = explanationSummary,
            OutcomeSchemaVersion = schemaVersion
        };
    }

    internal static bool HasV2SchemaVersion(JsonElement root) =>
        root.ValueKind == JsonValueKind.Object &&
        root.TryGetProperty("schemaVersion", out JsonElement version) &&
        version.ValueKind == JsonValueKind.String &&
        version.ValueEquals(SchemaV2);

    private static void TryParseV2(
        string outcomeJson,
        out EvaluationScoreResponse? evaluation,
        out string? explanationSummary,
        out string? schemaVersion)
    {
        evaluation = null;
        explanationSummary = null;
        schemaVersion = null;

        if (string.IsNullOrWhiteSpace(outcomeJson))
            return;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(outcomeJson);

            JsonElement root = doc.RootElement;

            if (!HasV2SchemaVersion(root))
                return;

            schemaVersion = SchemaV2;

            if (root.TryGetProperty("explanationSummary", out JsonElement es) &&
                es.ValueKind == JsonValueKind.String)

                explanationSummary = es.GetString();

            if (!root.TryGetProperty("evaluation", out JsonElement ev) ||
                ev.ValueKind is not (JsonValueKind.Object or JsonValueKind.Null))
                return;

            if (ev.ValueKind == JsonValueKind.Object)

                evaluation = JsonSerializer.Deserialize<EvaluationScoreResponse>(ev.GetRawText(), ParseOptions);
        }
        catch (JsonException)
        {
            // Legacy flat shadow JSON — no evaluation block.
        }
    }
}
