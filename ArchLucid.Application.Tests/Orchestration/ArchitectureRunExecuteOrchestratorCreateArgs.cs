using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Runs;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>
///     Optional dependencies for <see cref="ArchitectureRunExecuteOrchestratorTestFactory.Create" />.
/// </summary>
public sealed class ArchitectureRunExecuteOrchestratorCreateArgs
{
    public IAgentEvaluationService? AgentEvaluationService { get; init; }

    public IAgentResultRepository? AgentResultRepository { get; init; }

    public IAgentEvaluationRepository? AgentEvaluationRepository { get; init; }

    public IAgentEvidencePackageRepository? AgentEvidencePackageRepository { get; init; }

    public IEvidenceBuilder? EvidenceBuilder { get; init; }

    public IActorContext? ActorContext { get; init; }

    public IBaselineMutationAuditService? BaselineMutationAuditService { get; init; }

    public ArchitectureRunExecutePostExecuteHooks? PostExecuteHooks { get; init; }

    public IArchLucidUnitOfWorkFactory? UnitOfWorkFactory { get; init; }

    public IAgentOutputTraceEvaluationHook? OutputTraceEvaluationHook { get; init; }

    public IAgentResultPostExecutionEnricher? AgentResultPostExecutionEnricher { get; init; }

    public IEvidencePackageInjectionMitigator? EvidencePackageInjectionMitigator { get; init; }

    public IAgentEvidenceUntrustedInputSanitizer? AgentEvidenceUntrustedInputSanitizer { get; init; }

    public IRequestContentSafetyPrecheck? RequestContentSafetyPrecheck { get; init; }

    public IOptions<AgentExecutionOptions>? AgentExecutionOptions { get; init; }

    public IEffectiveAgentExecutionModeAccessor? EffectiveAgentExecutionModeAccessor { get; init; }

    public IOptions<AgentOutputQualityGateOptions>? AgentOutputQualityGateOptions { get; init; }

    public IRunStateTransitionService? RunStateTransitionService { get; init; }

    public IRunGovernanceScopePinService? RunGovernanceScopePinService { get; init; }

    public IRunEngineProvenanceCaptureService? RunEngineProvenanceCaptureService { get; init; }

    public IExecuteTimeGovernanceScopeCaptureService? ExecuteTimeGovernanceScopeCaptureService { get; init; }

    public TechnologyLedgerTopologyProposalSeeder? TopologyProposalSeeder { get; init; }

    public DemoExpensiveActionGate? DemoExpensiveActionGate { get; init; }

    public IRunScopedLlmBudgetReservationService? RunScopedLlmBudgetReservationService { get; init; }

    public IOperationCancellationRegistry? OperationCancellationRegistry { get; init; }

    public OperationRunCancellationMarker? RunCancellationMarker { get; init; }

    public IRunExecuteOwnershipLeaseService? RunExecuteOwnershipLeaseService { get; init; }

    public IRunStageOutcomesRepository? RunStageOutcomesRepository { get; init; }

    public IAgentExecutionReadinessGuard? AgentExecutionReadinessGuard { get; init; }

    public ILogger<ArchitectureRunExecuteOrchestrator>? Logger { get; init; }

    public IIncompleteAuthorityPipelineExecuteHandler? IncompleteAuthorityPipelineExecuteHandler { get; init; }
}
