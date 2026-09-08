using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Stable <c>LastFailureReason</c> payload when execute ownership lease reconciliation marks a run terminal.</summary>
public static class RunExecuteOwnershipReconciliationFailureSummary
{
    public const string TriageScenarioId = "execute-ownership-lease-expired";

    public static AgentExecutionFailureSummary Create() =>
        new()
        {
            FailureClass = AgentExecutionFailureClasses.Dependency,
            ReasonCode = AgentExecutionTraceFailureReasonCodes.ExecuteOwnershipLeaseExpired,
            TriageScenarioId = TriageScenarioId,
        };
}
