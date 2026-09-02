using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.GoldenCorpus;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Parsing and environment helpers for <see cref="GoldenCohortDriftCommand" />.
/// </summary>
internal static class GoldenCohortDriftParser
{
    internal static List<AgentResult>? TryParseAgentResults(
        List<object> raw,
        string itemId,
        out string? error)
    {
        error = null;

        List<AgentResult> list = [];
        int i = 0;

        foreach (AgentResult? ar in raw.Select(o => JsonSerializer.Serialize(o, ContractJson.Default))
                     .Select(j => JsonSerializer.Deserialize<AgentResult>(j, ContractJson.Default)))
        {
            if (ar is null)
            {
                error =
                    $"[{itemId}] could not deserialize agent result at index {i.ToString(CultureInfo.InvariantCulture)}.";

                return null;
            }

            list.Add(ar);
            i++;
        }

        if (list.Count != 0)
            return list;

        error = $"[{itemId}] no agent results returned for drift analysis.";

        return null;
    }

    internal static bool IsRealLlmContext() =>
        IsTruthyEnvironment("ARCHLUCID_GOLDEN_COHORT_REAL_LLM")
        || string.Equals(
            Environment.GetEnvironmentVariable("ARCHLUCID_AGENT_EXECUTION_MODE")?.Trim() ?? string.Empty,
            "Real",
            StringComparison.OrdinalIgnoreCase)
        || string.Equals(
            Environment.GetEnvironmentVariable("AgentExecution__Mode")?.Trim() ?? string.Empty,
            "Real",
            StringComparison.OrdinalIgnoreCase);

    internal static bool IsTruthyEnvironment(string name)
    {
        string? raw = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string v = raw.Trim();

        return string.Equals(v, "1", StringComparison.Ordinal)
               || string.Equals(v, "true", StringComparison.OrdinalIgnoreCase)
               || string.Equals(v, "yes", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool CategoriesMatch(GoldenCohortItem item, List<AgentResult> agentResults)
    {
        SortedSet<string> actualCategories = GoldenCohortFindingCategoryAggregator.DistinctCategories(agentResults);
        SortedSet<string> expectedCategories = new(StringComparer.Ordinal);

        foreach (string c in item.ExpectedFindingCategories.Where(c => !string.IsNullOrWhiteSpace(c)))
            expectedCategories.Add(c.Trim());

        return actualCategories.SetEquals(expectedCategories);
    }

    internal static List<GoldenCohortDriftCommand.GoldenCohortDriftStructuralFailure> ValidateStructuralResults(
        GoldenCohortItem item,
        string runId,
        List<object> rawResults)
    {
        List<GoldenCohortDriftCommand.GoldenCohortDriftStructuralFailure> failures = [];

        for (int ri = 0; ri < rawResults.Count; ri++)
        {
            object raw = rawResults[ri];
            string resultJson = JsonSerializer.Serialize(raw, ContractJson.Default);
            AgentResult? r = JsonSerializer.Deserialize<AgentResult>(resultJson, ContractJson.Default);

            if (r is null)
                continue;

            RealLlmStructuralValidationResult validation =
                RealLlmOutputStructuralValidator.ValidateAgentResultStructure(r.AgentType.ToString(), resultJson);

            if (validation.IsValid)
                continue;

            failures.Add(
                new GoldenCohortDriftCommand.GoldenCohortDriftStructuralFailure
                {
                    CohortItemId = item.Id,
                    RunId = runId,
                    Code = "structuralValidation",
                    Message = "One or more structural checks failed for an agent result.",
                    AgentType = r.AgentType.ToString(),
                    ResultId = r.ResultId,
                    Validation = validation,
                });
        }

        return failures;
    }
}
