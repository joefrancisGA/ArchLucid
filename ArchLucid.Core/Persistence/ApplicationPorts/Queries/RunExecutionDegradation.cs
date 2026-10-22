using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Queries;

/// <summary>Projects simulator fallback + LLM resource fallback (from traces) onto run query DTOs.</summary>
public static class RunExecutionDegradation
{
    public static async Task PopulateSummariesAsync(
        ScopeContext scope,
        IReadOnlyList<RunSummaryDto> summaries,
        IReadOnlyList<RunRecord> runs,
        IAgentExecutionTraceRepository traceRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(summaries);
        ArgumentNullException.ThrowIfNull(runs);
        ArgumentNullException.ThrowIfNull(traceRepository);

        if (summaries.Count != runs.Count)

            throw new ArgumentException("Run summaries and run records must have the same length.");

        if (summaries.Count == 0)
            return;

        string[] runIdStrings = runs.Select(static r => r.RunId.ToString("N")).ToArray();

        IReadOnlyDictionary<string, IReadOnlyList<string>> byRun =
            await traceRepository.GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
                scope,
                runIdStrings,
                cancellationToken);

        for (int i = 0; i < summaries.Count; i++)
        {
            RunRecord run = runs[i];
            string key = run.RunId.ToString("N");

            byRun.TryGetValue(key, out IReadOnlyList<string>? agents);

            Apply(summaries[i], run, agents ?? []);
        }
    }

    public static void Apply(RunSummaryDto dto, RunRecord run, IReadOnlyList<string> llmFallbackAgentTypes)
    {
        ArgumentNullException.ThrowIfNull(dto);

        (dto.RunDegradedExecution, dto.DegradedExecutionAgents) =
            ComputeDegradation(run, llmFallbackAgentTypes);
    }

    public static void Apply(RunDetailDto dto, RunRecord run, IReadOnlyList<string> llmFallbackAgentTypes)
    {
        ArgumentNullException.ThrowIfNull(dto);

        (dto.RunDegradedExecution, dto.DegradedExecutionAgents) =
            ComputeDegradation(run, llmFallbackAgentTypes);
    }

    private static (bool RunDegradedExecution, IReadOnlyList<string> DegradedExecutionAgents) ComputeDegradation(
        RunRecord run,
        IReadOnlyList<string> llmFallbackAgentTypes)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(llmFallbackAgentTypes);

        List<string> ordered = llmFallbackAgentTypes
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static s => s, StringComparer.OrdinalIgnoreCase)
            .ToList();

        bool degraded = run.RealModeFellBackToSimulator || ordered.Count > 0;

        return (degraded, ordered);
    }
}
