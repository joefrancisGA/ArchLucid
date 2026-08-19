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

        AgentModelCatalogRow? existing = await _catalogRepository.TryGetAsync(aliasId, cancellationToken).ConfigureAwait(false);

        if (existing is null)
        {
            throw new KeyNotFoundException($"Model alias '{aliasId}' is not registered.");
        }

        FaithfulnessHarnessSummary? summary =
            await _harnessSummaryReader.TryReadLatestAsync(cancellationToken).ConfigureAwait(false);

        if (summary is null)
        {
            throw new InvalidOperationException(
                "Faithfulness harness summary was not found. Run scripts/ci/eval_agent_faithfulness.py first.");
        }

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

        AgentModelCatalogRow updated = existing;

        foreach (string taskType in existing.ApprovedTaskTypes.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            updated = await _evaluationRecorder
                .RecordTaskEvaluationAsync(
                    aliasId,
                    taskType,
                    evaluationState,
                    evidenceJson,
                    actorUserId,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        return updated;
    }
}
