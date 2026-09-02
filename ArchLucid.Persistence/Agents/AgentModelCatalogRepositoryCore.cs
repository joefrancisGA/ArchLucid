using System.Text.Json;

using ArchLucid.Core.Agents;

namespace ArchLucid.Persistence.Agents;

internal static class AgentModelCatalogRepositoryCore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static AgentModelCatalogRow Clone(AgentModelCatalogRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new AgentModelCatalogRow
        {
            AliasId = row.AliasId,
            ProviderConnectionKind = row.ProviderConnectionKind,
            DeploymentName = row.DeploymentName,
            TierBinding = row.TierBinding,
            CapabilityTags = row.CapabilityTags.ToList(),
            ApprovedTaskTypes = row.ApprovedTaskTypes.ToList(),
            StructuredOutputLevel = row.StructuredOutputLevel,
            DataBoundary = row.DataBoundary,
            ExternalSubprocessorDisclosureComplete = row.ExternalSubprocessorDisclosureComplete,
            LifecycleStatus = row.LifecycleStatus,
            StructuredOutputProbeUtc = row.StructuredOutputProbeUtc,
            TokenizerProfile = row.TokenizerProfile,
            CharsPerToken = row.CharsPerToken,
            TokenizerErrorMarginPercent = row.TokenizerErrorMarginPercent,
            InputUsdPerMillionTokens = row.InputUsdPerMillionTokens,
            OutputUsdPerMillionTokens = row.OutputUsdPerMillionTokens,
            ReasoningUsdPerMillionTokens = row.ReasoningUsdPerMillionTokens,
            Evaluations = row.Evaluations
                .Select(
                    evaluation => new AgentModelCatalogEvaluationRow
                    {
                        TaskType = evaluation.TaskType,
                        EvaluationState = evaluation.EvaluationState,
                        EvidenceJson = evaluation.EvidenceJson,
                        EvaluatedUtc = evaluation.EvaluatedUtc,
                    })
                .ToList(),
        };
    }

    public static AgentModelCatalogRow MapEntry(
        EntryDbRow entry,
        IReadOnlyList<AgentModelCatalogEvaluationRow> evaluations)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new AgentModelCatalogRow
        {
            AliasId = entry.AliasId,
            ProviderConnectionKind = entry.ProviderConnectionKind,
            DeploymentName = entry.DeploymentName,
            TierBinding = entry.TierBinding,
            CapabilityTags = DeserializeList(entry.CapabilityTagsJson),
            ApprovedTaskTypes = DeserializeList(entry.ApprovedTaskTypesJson),
            StructuredOutputLevel = Enum.TryParse(entry.StructuredOutputLevel, true, out AgentModelStructuredOutputLevel level)
                ? level
                : AgentModelStructuredOutputLevel.StrictJsonSchema,
            DataBoundary = Enum.TryParse(entry.DataBoundary, true, out AgentModelDataBoundaryKind boundary)
                ? boundary
                : AgentModelDataBoundaryKind.AzureBoundary,
            ExternalSubprocessorDisclosureComplete = entry.ExternalSubprocessorDisclosureComplete,
            LifecycleStatus = Enum.TryParse(entry.LifecycleStatus, true, out AgentModelCatalogLifecycleStatus lifecycle)
                ? lifecycle
                : AgentModelCatalogLifecycleStatus.Available,
            StructuredOutputProbeUtc = entry.StructuredOutputProbeUtc,
            TokenizerProfile = Enum.TryParse(entry.TokenizerProfile, true, out AgentModelTokenizerProfile tokenizerProfile)
                ? tokenizerProfile
                : AgentModelTokenizerProfile.CharHeuristic,
            CharsPerToken = entry.CharsPerToken > 0 ? entry.CharsPerToken : AgentModelCatalogTokenMath.DefaultCharsPerToken,
            TokenizerErrorMarginPercent = entry.TokenizerErrorMarginPercent > 0m
                ? entry.TokenizerErrorMarginPercent
                : AgentModelCatalogPricingDefaults.DefaultTokenizerErrorMarginPercent,
            InputUsdPerMillionTokens = entry.InputUsdPerMillionTokens,
            OutputUsdPerMillionTokens = entry.OutputUsdPerMillionTokens,
            ReasoningUsdPerMillionTokens = entry.ReasoningUsdPerMillionTokens,
            Evaluations = evaluations,
        };
    }

    public static AgentModelCatalogEvaluationRow MapEvaluation(EvalDbRow row) =>
        new()
        {
            TaskType = row.TaskType,
            EvaluationState = Enum.TryParse(row.EvaluationState, true, out AgentModelEvaluationStateKind state)
                ? state
                : AgentModelEvaluationStateKind.NotEvaluated,
            EvidenceJson = row.EvidenceJson,
            EvaluatedUtc = row.EvaluatedUtc,
        };

    public static IReadOnlyList<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public sealed class EntryDbRow
    {
        public string AliasId { get; set; } = string.Empty;

        public string ProviderConnectionKind { get; set; } = string.Empty;

        public string? DeploymentName { get; set; }

        public string? TierBinding { get; set; }

        public string CapabilityTagsJson { get; set; } = "[]";

        public string ApprovedTaskTypesJson { get; set; } = "[]";

        public string StructuredOutputLevel { get; set; } = nameof(AgentModelStructuredOutputLevel.StrictJsonSchema);

        public string DataBoundary { get; set; } = nameof(AgentModelDataBoundaryKind.AzureBoundary);

        public bool ExternalSubprocessorDisclosureComplete { get; set; }

        public string LifecycleStatus { get; set; } = nameof(AgentModelCatalogLifecycleStatus.Available);

        public DateTime? StructuredOutputProbeUtc { get; set; }

        public string TokenizerProfile { get; set; } = nameof(AgentModelTokenizerProfile.CharHeuristic);

        public int CharsPerToken { get; set; } = AgentModelCatalogTokenMath.DefaultCharsPerToken;

        public decimal TokenizerErrorMarginPercent { get; set; } =
            AgentModelCatalogPricingDefaults.DefaultTokenizerErrorMarginPercent;

        public decimal? InputUsdPerMillionTokens { get; set; }

        public decimal? OutputUsdPerMillionTokens { get; set; }

        public decimal? ReasoningUsdPerMillionTokens { get; set; }
    }

    public sealed class EvalDbRow
    {
        public string AliasId { get; set; } = string.Empty;

        public string TaskType { get; set; } = string.Empty;

        public string EvaluationState { get; set; } = nameof(AgentModelEvaluationStateKind.NotEvaluated);

        public string? EvidenceJson { get; set; }

        public DateTime? EvaluatedUtc { get; set; }
    }
}
