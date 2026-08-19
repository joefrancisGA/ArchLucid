using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Tests.Orchestration;

public sealed record ArchitectureRunExecuteOrchestratorTailDependencies(
    TechnologyLedgerTopologyProposalSeeder TopologyProposalSeeder,
    DemoExpensiveActionGate DemoExpensiveActionGate,
    IRunScopedLlmBudgetReservationService RunScopedLlmBudgetReservationService,
    IOperationCancellationRegistry OperationCancellationRegistry,
    OperationRunCancellationMarker RunCancellationMarker,
    IRunExecuteOwnershipLeaseService RunExecuteOwnershipLeaseService,
    IRunStageOutcomesRepository RunStageOutcomesRepository,
    ILogger<ArchitectureRunExecuteOrchestrator> Logger);
