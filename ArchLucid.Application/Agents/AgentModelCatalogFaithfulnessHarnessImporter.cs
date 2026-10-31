using System.Text.Json;

using ArchLucid.Core.Agents;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Application.Agents;

public interface IAgentModelCatalogFaithfulnessHarnessImporter
{
    Task<AgentModelCatalogRow> ImportForAliasAsync(string aliasId, string actorUserId, CancellationToken cancellationToken);
}

/// <summary>Operator-triggered import of offline faithfulness harness evidence onto catalog rows (TB-2105).</summary>
public sealed class AgentModelCatalogFaithfulnessHarnessImporter(
    IAgentModelCatalogRepository catalogRepository,
    IFaithfulnessHarnessSummaryReader harnessSummaryReader,
    IAgentModelCatalogEvaluationRecorder evaluationRecorder) : IAgentModelCatalogFaithfulnessHarnessImporter
{
    public const string HarnessScriptName = "scripts/ci/eval_agent_faithfulness.py";

    private readonly IAgentModelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    private readonly IFaithfulnessHarnessSummaryReader _harnessSummaryReader =
        harnessSummaryReader ?? throw new ArgumentNullException(nameof(harnessSummaryReader));

    private readonly IAgentModelCatalogEvaluationRecorder _evaluationRecorder =
        evaluationRecorder ?? throw new ArgumentNullException(nameof(evaluationRecorder));

    public async Task<AgentModelCatalogRow> ImportForAliasAsync(
        string aliasId,
        string actorUserId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(aliasId);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        string normalizedAliasId = aliasId.Trim();
        string normalizedActorUserId = actorUserId.Trim();

        AgentModelCatalogRow? existing = await _catalogRepository.TryGetAsync(normalizedAliasId, cancellationToken).ConfigureAwait(false);

        if (existing is null)
        {
            throw new KeyNotFoundException($"Model alias '{normalizedAliasId}' is not registered.");
        }

        FaithfulnessHarnessSummary? summary =
            await _harnessSummaryReader.TryReadLatestAsync(cancellationToken).ConfigureAwait(false);

        if (summary is null)
        {
            throw new InvalidOperationException(
                "Faithfulness harness summary was not found. Run scripts/ci/eval_agent_faithfulness.py first.");
        }

        if (summary.CasesEvaluated <= 0)
        {
            throw new InvalidOperationException(
                "Faithfulness harness summary reports zero evaluated cases. Re-run scripts/ci/eval_agent_faithfulness.py before import.");
        }

        EnsureHarnessSummaryRatiosAreValid(summary);

        AgentModelEvaluationStateKind evaluationState =
            summary.PositiveReadinessSupportRatio >= summary.FloorMinSupportRatio
                ? AgentModelEvaluationStateKind.Evaluated
                : AgentModelEvaluationStateKind.Failed;

        string evidenceJson = JsonSerializer.Serialize(
            new
            {
                harness = HarnessScriptName,
                summary.FormatVersion,
                summary.CasesEvaluated,
                summary.PositiveReadinessSupportRatio,
                summary.NegativeControlSupportRatio,
                summary.CombinedDiagnosticSupportRatio,
                summary.FloorMinSupportRatio,
                importedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            });

        List<string> taskTypes = CollectApprovedTaskTypes(existing.ApprovedTaskTypes);

        // An empty approved-task list is a valid catalog row. Returning it unchanged makes
        // POST import-faithfulness-harness look successful when no evaluation was stored.

        if (taskTypes.Count == 0)
        {
            throw new InvalidOperationException(
                $"Model alias '{normalizedAliasId}' has no approved task types to attach faithfulness harness evidence.");
        }

        AgentModelCatalogRow updated = existing;

        foreach (string taskType in taskTypes)
        {
            updated = await _evaluationRecorder
                .RecordTaskEvaluationAsync(
                    normalizedAliasId,
                    taskType,
                    evaluationState,
                    evidenceJson,
                    normalizedActorUserId,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        return updated;
    }

    private static void EnsureHarnessSummaryRatiosAreValid(FaithfulnessHarnessSummary summary)
    {
        if (!AreAllSupportRatiosFinite(summary))
        {
            throw new InvalidOperationException(
                "Faithfulness harness summary contains non-finite support ratios. Re-run scripts/ci/eval_agent_faithfulness.py before import.");
        }

        if (!AreAllSupportRatiosInUnitInterval(summary))
        {
            throw new InvalidOperationException(
                "Faithfulness harness summary contains support ratios outside the [0,1] range. Re-run scripts/ci/eval_agent_faithfulness.py before import.");
        }
    }

    private static bool AreAllSupportRatiosFinite(FaithfulnessHarnessSummary summary) =>
        double.IsFinite(summary.PositiveReadinessSupportRatio)
        && double.IsFinite(summary.NegativeControlSupportRatio)
        && double.IsFinite(summary.CombinedDiagnosticSupportRatio)
        && double.IsFinite(summary.FloorMinSupportRatio);

    private static bool AreAllSupportRatiosInUnitInterval(FaithfulnessHarnessSummary summary) =>
        IsUnitIntervalRatio(summary.PositiveReadinessSupportRatio)
        && IsUnitIntervalRatio(summary.NegativeControlSupportRatio)
        && IsUnitIntervalRatio(summary.CombinedDiagnosticSupportRatio)
        && IsUnitIntervalRatio(summary.FloorMinSupportRatio);

    private static bool IsUnitIntervalRatio(double value) => value >= 0d && value <= 1d;

    private static List<string> CollectApprovedTaskTypes(IReadOnlyList<string>? approvedTaskTypes)
    {
        if (approvedTaskTypes is null || approvedTaskTypes.Count == 0)
            return [];

        return approvedTaskTypes
            .Select(static taskType => taskType?.Trim() ?? string.Empty)
            .Where(static taskType => taskType.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
