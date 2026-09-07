using System.Text.Json;

using ArchLucid.Contracts.Risk;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.WafTradeoff;

namespace ArchLucid.Decisioning.Risk;

internal static class TradeoffConflictExplanationComposer
{
    private const string SystemPrompt =
        """
        You explain architecture tradeoff conflicts for enterprise architects and executives.
        Do not invent probabilities or statistics.
        State consequences in terms of schedule, cost, or compliance exposure only.
        Return JSON with keys explanationArchitect, explanationExecutive, and counterfactualStatement.
        """;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    public static async Task ApplyExplanationsAsync(
        IFindingPayloadJsonCompletionClient completionClient,
        IWafTradeoffCatalog catalog,
        IReadOnlyList<ArchitectureTradeoff> tradeoffs,
        IReadOnlyList<string> statedRequirements,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(completionClient);
        ArgumentNullException.ThrowIfNull(catalog);
        ArgumentNullException.ThrowIfNull(tradeoffs);

        foreach (ArchitectureTradeoff tradeoff in tradeoffs)
        {
            if (tradeoff.Status != TradeoffStatus.Conflicting)
                continue;

            WafTradeoffCatalogEntry? catalogEntry = catalog.FindByKey(tradeoff.Mechanism);
            WafTradeoffCatalogEntry? counterfactualEntry =
                tradeoff.CounterfactualRef is null ? null : catalog.FindByKey(tradeoff.CounterfactualRef);

            string userPrompt = BuildUserPrompt(tradeoff, catalogEntry, counterfactualEntry, statedRequirements);
            string rawJson = await completionClient
                .CompleteJsonAsync(SystemPrompt, userPrompt, cancellationToken)
                .ConfigureAwait(false);

            TradeoffConflictExplanationDocument? explanation =
                JsonSerializer.Deserialize<TradeoffConflictExplanationDocument>(rawJson, JsonOptions);

            if (explanation is null)
                continue;

            tradeoff.ExplanationArchitect = explanation.ExplanationArchitect;
            tradeoff.ExplanationExecutive = explanation.ExplanationExecutive;
            tradeoff.CounterfactualStatement = explanation.CounterfactualStatement;
        }
    }

    private static string BuildUserPrompt(
        ArchitectureTradeoff tradeoff,
        WafTradeoffCatalogEntry? catalogEntry,
        WafTradeoffCatalogEntry? counterfactualEntry,
        IReadOnlyList<string> statedRequirements)
    {
        string conflictingRequirement = ResolveConflictingRequirementText(tradeoff, statedRequirements);

        return
            $"""
             Tradeoff mechanism: {catalogEntry?.MechanismLabel ?? tradeoff.Mechanism}
             Gained pillar: {tradeoff.GainedPillar}
             Sacrificed pillar: {tradeoff.SacrificedPillar}
             Conflicting requirement: {conflictingRequirement}
             Counterfactual mechanism: {counterfactualEntry?.MechanismLabel ?? tradeoff.CounterfactualRef ?? "unknown"}
             Counterfactual key: {tradeoff.CounterfactualRef ?? "none"}

             Produce:
             1. explanationArchitect: 1-2 sentence plain-language conflict statement.
             2. explanationExecutive: 1 sentence consequence translation (schedule, cost, or compliance exposure only).
             3. counterfactualStatement: closed-form statement beginning with "To satisfy" describing the catalog inverse mechanism and approximate impact.
             """;
    }

    private static string ResolveConflictingRequirementText(
        ArchitectureTradeoff tradeoff,
        IReadOnlyList<string> statedRequirements)
    {
        if (string.IsNullOrWhiteSpace(tradeoff.ConflictingRequirementId))
            return "unspecified requirement";

        if (!tradeoff.ConflictingRequirementId.StartsWith("req-", StringComparison.Ordinal))
            return tradeoff.ConflictingRequirementId;

        string indexText = tradeoff.ConflictingRequirementId["req-".Length..];

        if (!int.TryParse(indexText, out int index) || index < 0 || index >= statedRequirements.Count)
            return tradeoff.ConflictingRequirementId;

        return statedRequirements[index];
    }

    private sealed class TradeoffConflictExplanationDocument
    {
        public string? ExplanationArchitect
        {
            get;
            set;
        }

        public string? ExplanationExecutive
        {
            get;
            set;
        }

        public string? CounterfactualStatement
        {
            get;
            set;
        }
    }
}
