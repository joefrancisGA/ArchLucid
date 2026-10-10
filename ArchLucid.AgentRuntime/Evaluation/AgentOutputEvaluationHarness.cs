using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IAgentOutputEvaluationHarness" />
public sealed class AgentOutputEvaluationHarness(
    IAgentOutputEvaluator structuralEvaluator,
    IHeuristicAgentOutputSemanticEvaluator semanticEvaluator) : IAgentOutputEvaluationHarness
{
    private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web);

    /// <inheritdoc />
    public AgentOutputHarnessResult Evaluate(AgentType agentType, AgentResult actual, AgentOutputExpectation expected)
    {
        ArgumentNullException.ThrowIfNull(actual);
        ArgumentNullException.ThrowIfNull(expected);

        List<string> failures = [];
        const string traceId = "harness";
        string json = JsonSerializer.Serialize(actual, WebJson);

        AgentOutputEvaluationScore structural = structuralEvaluator.Evaluate(traceId, json, agentType);
        AgentOutputSemanticScore semantic = semanticEvaluator.Evaluate(traceId, json, agentType);

        if (structural.IsJsonParseFailure)

            failures.Add("Structural evaluation reported JSON parse failure.");

        if (expected.MinimumStructuralCompleteness > 0
            && structural.StructuralCompletenessRatio + 1e-9 < expected.MinimumStructuralCompleteness)

            failures.Add(
                $"Structural completeness {structural.StructuralCompletenessRatio:F3} below minimum {expected.MinimumStructuralCompleteness:F3}.");

        if (expected.MinimumSemanticScore > 0
            && semantic.OverallSemanticScore + 1e-9 < expected.MinimumSemanticScore)

            failures.Add(
                $"Semantic score {semantic.OverallSemanticScore:F3} below minimum {expected.MinimumSemanticScore:F3}.");

        int validFindingCount = actual.Findings.Count(static finding => finding is not null);

        if (expected.MinimumFindingCount > 0 && validFindingCount < expected.MinimumFindingCount)

            failures.Add(
                $"Finding count {validFindingCount} below minimum {expected.MinimumFindingCount}.");

        if (expected.RequiredJsonKeys.Count > 0)

            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);

                if (doc.RootElement.ValueKind != JsonValueKind.Object)

                    failures.Add("Serialized AgentResult root is not a JSON object (required keys check).");

                else
                {
                    HashSet<string> names = new(StringComparer.Ordinal);

                    foreach (JsonProperty p in doc.RootElement.EnumerateObject())

                        names.Add(p.Name);

                    failures.AddRange(from key in expected.RequiredJsonKeys
                                      where !string.IsNullOrWhiteSpace(key)
                                      where !names.Contains(key.Trim())
                                      select $"Required JSON key missing: '{key.Trim()}'.");
                }
            }
            catch (JsonException)
            {
                failures.Add("Could not parse serialized AgentResult for required JSON keys.");
            }

        // Agent output is an untrusted JSON boundary; malformed null findings must become
        // a failed harness result rather than aborting evaluation.
        HashSet<string> findingCategories = actual.Findings
            .Where(static finding => finding is not null)
            .Select(static finding => finding!.Category?.Trim())
            .Where(static category => !string.IsNullOrEmpty(category))
            .Select(static category => category!.ToUpperInvariant())
            .ToHashSet();

        int categoryHits = 0;

        foreach (string cat in expected.ExpectedFindingCategories)
        {
            if (string.IsNullOrWhiteSpace(cat))
                continue;

            if (findingCategories.Contains(cat.Trim().ToUpperInvariant()))

                categoryHits++;

            else

                failures.Add($"Expected finding category not present: '{cat.Trim()}'.");
        }

        int requiredCategoryCount = expected.ExpectedFindingCategories.Count(static c => !string.IsNullOrWhiteSpace(c));
        double categoryRatio = requiredCategoryCount == 0 ? 1.0 : (double)categoryHits / requiredCategoryCount;

        bool passed = failures.Count == 0;

        return new AgentOutputHarnessResult
        {
            Passed = passed,
            StructuralCompletenessRatio = structural.StructuralCompletenessRatio,
            SemanticScore = semantic.OverallSemanticScore,
            CategoryCoverageRatio = categoryRatio,
            Failures = failures,
            AgentType = agentType
        };
    }
}
