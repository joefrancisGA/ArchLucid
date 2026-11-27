using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.Analysis;

/// <summary>Append-only exact lineage metadata, with no raw effective configuration or engine payloads.</summary>
internal static class AnalysisDependencyAudit
{
    public static Task AppendAsync(IAuditRepository audit, TimeProvider clock, AnalysisRecoveryStageKey key,
        AnalysisDependencyBinding binding, AnalysisDependencyDecision decision,
        string outputReference, long fence, IArchLucidUnitOfWork transaction, CancellationToken ct)
    {
        if (!transaction.SupportsExternalTransaction || transaction.Connection is null || transaction.Transaction is null)
            throw new InvalidOperationException("Analysis dependency provenance requires an enlisted transaction.");

        return audit.AppendAsync(new AuditEvent
        {
            EventType = AuditEventTypes.AnalyticalDependencyCheckpointRecorded,
            OccurredUtc = clock.UtcNowDateTime(),
            ActorUserId = "system.analysis-recovery",
            ActorUserName = "Analysis recovery",
            ExplicitActor = true,
            TenantId = key.Scope.TenantId,
            WorkspaceId = key.Scope.WorkspaceId,
            ProjectId = key.Scope.ProjectId,
            RunId = key.Pipeline == "authority" ? key.RunId : null,
            DataJson = JsonSerializer.Serialize(new
            {
                key.Pipeline,
                ExecutionId = key.RunId,
                key.Stage,
                binding.GraphVersion,
                binding.LocalWitness,
                binding.LocalInputs,
                binding.InputVersion,
                binding.Upstream,
                OutputWitness = AnalysisDependencyFingerprint.Digest(outputReference),
                Fence = fence,
                Action = decision.ActionName,
                decision.Reason,
                decision.Trigger,
            }),
        }, ct, transaction.Connection, transaction.Transaction);
    }
}
