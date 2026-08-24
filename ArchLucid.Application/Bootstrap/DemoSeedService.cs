using System.Text.Json;
using System.Threading;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Idempotent seed for the Retail Checkout Modernization **trusted baseline** (two committed runs, governance workflow,
///     activations).
/// </summary>
/// <remarks>
///     Persists via <c>ArchLucid.Persistence</c> repositories. **Authority-only after ADR 0030 PR A3 (2026-04-24):**
///     each demo run is inserted into <c>dbo.Runs</c> via <see cref = "IRunRepository.SaveAsync"/> (project slug
///     <c>Retail Checkout Platform</c>, matching system-name-as-project-id from coordinator ingestion mapping).
///     Committed manifest bodies AND decision traces are written through
///     <see cref = "IAuthorityCommittedManifestChainWriter"/> in a single FK-chain insert
///     (Snapshot rows + GoldenManifest + AuthorityDecisionTrace). The previous
///     <c>ICoordinatorDecisionTraceRepository</c> second write to <c>dbo.DecisionTraces</c> was removed when
///     the coordinator interfaces themselves were deleted in PR A3 — see
///     <c>docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md</c>.
///     The export row is optional metadata for export history — not required for consulting DOCX replay. See
///     <c>docs/TRUSTED_BASELINE.md</c>.
/// </remarks>
public sealed partial class DemoSeedService(
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IAuthorityCommittedManifestChainWriter authorityCommittedManifestChainWriter,
    IOptionsMonitor<DemoOptions> demoOptions,
    IGovernanceApprovalRequestRepository approvalRepository,
    IGovernancePromotionRecordRepository promotionRepository,
    IGovernanceEnvironmentActivationRepository activationRepository,
    IRunExportRecordRepository runExportRecordRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IAuditService auditService,
    IActorContext actorContext,
    ILogger<DemoSeedService> logger) : IDemoSeedService
{
    private readonly IArtifactBundleRepository _artifactBundleRepository =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));
    private readonly IRunExportRecordRepository _runExportRecordRepository =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IGovernancePromotionRecordRepository _promotionRepository =
        promotionRepository ?? throw new ArgumentNullException(nameof(promotionRepository));

    private readonly IGovernanceEnvironmentActivationRepository _activationRepository =
        activationRepository ?? throw new ArgumentNullException(nameof(activationRepository));

    private readonly ILogger<DemoSeedService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IGovernanceApprovalRequestRepository _approvalRepository =
        approvalRepository ?? throw new ArgumentNullException(nameof(approvalRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private static readonly DateTime DemoUtc = new(2025, 3, 1, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime TrialWelcomeSeedUtc = new(2025, 6, 15, 14, 30, 0, DateTimeKind.Utc);
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuthorityCommittedManifestChainWriter _authorityCommittedManifestChainWriter =
        authorityCommittedManifestChainWriter ?? throw new ArgumentNullException(nameof(authorityCommittedManifestChainWriter));

    private readonly IOptionsMonitor<DemoOptions> _demoOptions = demoOptions ?? throw new ArgumentNullException(nameof(demoOptions));

    private static readonly JsonSerializerOptions DemoExportPersistJsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Startup hosted seed and <c>POST /v1/demo/seed</c> can overlap in CI — serialize to avoid partial workspace fixtures.</summary>
    private static readonly SemaphoreSlim DemoSeedConcurrencyGate = new(1, 1);

    /// <inheritdoc/>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await DemoSeedConcurrencyGate.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            await SeedAsyncCore(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            DemoSeedConcurrencyGate.Release();
        }
    }

    private async Task SeedAsyncCore(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scope.TenantId);

        foreach (DemoSeedStep step in BuildSeedSteps(scope, demo))
        {
            await RunSeedStepAsync(step, cancellationToken);
        }

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Demo seed completed (Retail Checkout Modernization). Runs: {Baseline}, {Hardened}.", demo.RunBaseline, demo.RunHardened);
    }

    /// <summary>
    ///     Seed order is load-bearing: the baseline request must exist before its committed runs, the runs before
    ///     governance and export rows, and the trusted baseline before the additional demo workspaces (which key
    ///     off the baseline scope's tenant). Order is defined by <see cref="DemoSeedScenarioRegistry"/>.
    /// </summary>
    private IReadOnlyList<DemoSeedStep> BuildSeedSteps(ScopeContext scope, ContosoRetailDemoIds demo)
    {
        Dictionary<string, Func<CancellationToken, Task>> executors = new(StringComparer.Ordinal)
        {
            ["retail-request"] = ct => EnsureRequestAsync(demo, ct),
            ["retail-run-baseline"] = ct => EnsureCommittedRunAsync(demo, demo.AuthorityRunBaselineId, demo.TaskBaseline, demo.ResultBaseline,
                demo.ManifestBaseline, demo.TraceBaseline, false, ct),
            ["retail-run-hardened"] = ct => EnsureCommittedRunAsync(demo, demo.AuthorityRunHardenedId, demo.TaskHardened, demo.ResultHardened,
                demo.ManifestHardened, demo.TraceHardened, true, ct),
            ["retail-governance"] = ct => EnsureGovernanceAsync(demo, ct),
            ["retail-export-record"] = ct => EnsureExportRecordAsync(demo, ct),
            ["northwind-product-tour"] = ct => EnsureNorthwindProductTourWorkspaceSeedAsync(scope, ct),
            ["meridian-alpine-regulated"] = ct => EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(scope, ct),
            ["created-package-sample"] = ct => EnsureCreatedArchitecturePackageSampleAsync(scope, ct)
        };

        List<DemoSeedStep> steps = [];

        foreach (DemoSeedScenarioDefinition registration in DemoSeedScenarioRegistry.ListSeedSteps())
        {
            if (!executors.TryGetValue(registration.StepName, out Func<CancellationToken, Task>? execute))
            {
                throw new InvalidOperationException(
                    $"Demo seed registry step '{registration.StepName}' has no executor in {nameof(DemoSeedService)}.");
            }

            steps.Add(new DemoSeedStep(registration.StepName, execute));
        }

        return steps;
    }

    private async Task RunSeedStepAsync(DemoSeedStep step, CancellationToken cancellationToken)
    {
        try
        {
            await step.ExecuteAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A mid-flight failure leaves a partially seeded workspace; naming the step makes the resulting
            // missing-row symptom traceable instead of surfacing only as an empty demo surface later.
            logger.LogError(ex, "Demo seed step {Step} failed.", step.Name);

            throw;
        }
    }
}
