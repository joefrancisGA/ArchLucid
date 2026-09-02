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

namespace ArchLucid.Application.Bootstrap.Seeders;

public sealed class DemoSeedRetailBaselineSeeder: IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps;

    public DemoSeedRetailBaselineSeeder(DemoSeedSeederDependencies deps)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
    }


    private static readonly string[] OwnedSteps = ["retail-request", "retail-run-baseline", "retail-run-hardened", "retail-export-record"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "retail-request" => EnsureRequestAsync(cancellationToken),
        "retail-run-baseline" => EnsureBaselineRunAsync(cancellationToken),
        "retail-run-hardened" => EnsureHardenedRunAsync(cancellationToken),
        "retail-export-record" => EnsureExportRecordAsync(cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step.")
    };


    private ContosoRetailDemoIds CurrentDemoIds() =>
        ContosoRetailDemoIds.ForTenant(_deps.ScopeContextProvider.GetCurrentScope().TenantId);

    private async Task EnsureRequestAsync(CancellationToken cancellationToken)
    {
        ContosoRetailDemoIds demo = CurrentDemoIds();

        if (await _deps.RequestRepository.GetByIdAsync(demo.RequestId, cancellationToken) is not null)
            return;

        ArchitectureRequest request = new()
        {
            RequestId = demo.RequestId,
            Description = "Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries.",
            SystemName = RetailBaselineWorkspaceSeed.SystemName,
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Minimize public ingress", "Retain existing payment processor integration"]
        };
        await _deps.RequestRepository.CreateAsync(request, cancellationToken);
    }

    private Task EnsureBaselineRunAsync(CancellationToken cancellationToken)
    {
        ContosoRetailDemoIds demo = CurrentDemoIds();

        return EnsureCommittedRunAsync(
            demo,
            demo.AuthorityRunBaselineId,
            demo.TaskBaseline,
            demo.ResultBaseline,
            demo.ManifestBaseline,
            demo.TraceBaseline,
            isHardened: false,
            cancellationToken);
    }

    private Task EnsureHardenedRunAsync(CancellationToken cancellationToken)
    {
        ContosoRetailDemoIds demo = CurrentDemoIds();

        return EnsureCommittedRunAsync(
            demo,
            demo.AuthorityRunHardenedId,
            demo.TaskHardened,
            demo.ResultHardened,
            demo.ManifestHardened,
            demo.TraceHardened,
            isHardened: true,
            cancellationToken);
    }

    private Task EnsureExportRecordAsync(CancellationToken cancellationToken) =>
        EnsureExportRecordCoreAsync(CurrentDemoIds(), cancellationToken);

    private async Task EnsureCommittedRunAsync(ContosoRetailDemoIds demo, Guid authorityRunId, string taskId, string resultId, string manifestVersion,
        string traceId, bool isHardened, CancellationToken cancellationToken)
    {
        ScopeContext scope = _deps.ScopeContextProvider.GetCurrentScope();
        // Contract/API run ids use "N" (see ContosoRetailDemoIds); InMemory agent repos match RunId with Ordinal string equality.
        string runId = authorityRunId.ToString("N");

        if (await _deps.RunRepository.GetByIdAsync(scope, authorityRunId, cancellationToken) is RunRecord existingRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingRun, cancellationToken);
            await EnsureTopologyAgentArtifactsAsync(scope, runId, taskId, resultId, isHardened, cancellationToken);

            return;
        }

        RunRecord authorityRow = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = authorityRunId,
            ProjectId = RetailBaselineWorkspaceSeed.SystemName,
            Description =
                isHardened
                    ? "Demo — Retail hardened manifest (trusted baseline seed)."
                    : "Demo — Retail baseline manifest (trusted baseline seed).",
            CreatedUtc = DemoSeedSeederSupport.DemoUtc,
            ArchitectureRequestId = demo.RequestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsSample = DemoSeedSeederSupport.ShouldMarkSeededRunAsSample(scope.TenantId)
        };
        await _deps.RunRepository.SaveAsync(authorityRow, cancellationToken);
        await EnsureTopologyAgentArtifactsAsync(scope, runId, taskId, resultId, isHardened, cancellationToken);
        bool richSeed = DemoSeedSeederSupport.IsVerticalDemoSeedDepth(_deps.DemoOptions.CurrentValue.SeedDepth);
        GoldenManifest manifest = RetailBaselineWorkspaceSeed.BuildManifest(runId, manifestVersion, isHardened, richSeed);
        AuthorityChainKeying chainKeying = new(AuthorityDemoChainIds.Manifest(authorityRunId), AuthorityDemoChainIds.ContextSnapshot(authorityRunId),
            AuthorityDemoChainIds.GraphSnapshot(authorityRunId), AuthorityDemoChainIds.FindingsSnapshot(authorityRunId),
            AuthorityDemoChainIds.DecisionTrace(authorityRunId));
        AuthorityManifestPersistResult authorityChain = await _deps.AuthorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, authorityRunId,
            RetailBaselineWorkspaceSeed.SystemName, manifest, chainKeying, DemoSeedSeederSupport.DemoUtc, richSeed, cancellationToken);
        await AuthorityCommittedChainDurableAudit.TryLogAsync(_deps.AuditService, _deps.ScopeContextProvider, _deps.ActorContext, _deps.Logger, authorityRunId,
            RetailBaselineWorkspaceSeed.SystemName, authorityChain, "demo-seed", richSeed, cancellationToken);
        // Decision-trace persistence happens inside PersistCommittedChainAsync above (AuthorityDecisionTrace
        // FK-chain row keyed by chainKeying.DecisionTraceId). The legacy second write to dbo.DecisionTraces
        // via ICoordinatorDecisionTraceRepository was removed in ADR 0030 PR A3 (2026-04-24) along with the
        // interface itself. The traceId / event-shape metadata is no longer surfaced for the demo seed because
        // ArchitectureRunDetail.DecisionTraces now reads from AuthorityDecisionTraces (see RunDetailQueryService).
        _ = traceId;
        RunRecord? authorityCommitted = await _deps.RunRepository.GetByIdAsync(scope, authorityRunId, cancellationToken);

        if (authorityCommitted is not null)
        {
            authorityCommitted.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            authorityCommitted.CurrentManifestVersion = manifestVersion;
            authorityCommitted.CompletedUtc = DemoSeedSeederSupport.DemoUtc;
            authorityCommitted.ContextSnapshotId = authorityChain.ContextSnapshotId;
            authorityCommitted.GraphSnapshotId = authorityChain.GraphSnapshotId;
            authorityCommitted.FindingsSnapshotId = authorityChain.FindingsSnapshotId;
            authorityCommitted.GoldenManifestId = authorityChain.GoldenManifestId;
            authorityCommitted.DecisionTraceId = authorityChain.DecisionTraceId;
            await _deps.RunRepository.UpdateAsync(authorityCommitted, cancellationToken);
        }
    }

    /// <summary>
    ///     Idempotent topology task + result rows for Contoso demo runs. Startup <c>Demo:SeedOnStartup</c> can leave a
    ///     committed run header without child rows when an earlier seed attempt fails mid-flight.
    /// </summary>
    private async Task EnsureTopologyAgentArtifactsAsync(
        ScopeContext scope,
        string runId,
        string taskId,
        string resultId,
        bool isHardened,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AgentResult> existingResults = await _deps.ResultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (existingResults.Count > 0)
            return;

        IReadOnlyList<AgentTask> existingTasks = await _deps.TaskRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (existingTasks.Count == 0)
        {
            AgentTask task = new()
            {
                TaskId = taskId,
                RunId = runId,
                AgentType = AgentType.Topology,
                Objective =
                    isHardened
                        ? "Hardened topology: add WAF, Key Vault references, and segmented subnets for retail APIs."
                        : "Baseline topology: single App Service and SQL for retail checkout (minimal segmentation).",
                Status = AgentTaskStatus.Completed,
                CreatedUtc = DemoSeedSeederSupport.DemoUtc,
                CompletedUtc = DemoSeedSeederSupport.DemoUtc,
                EvidenceBundleRef = null,
                AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Topology),
                AllowedSources = []
            };

            await _deps.TaskRepository.CreateManyAsync([task], cancellationToken);
        }

        AgentResult result = new()
        {
            ResultId = resultId,
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims =
            [
                isHardened
                    ? "Proposed hardened retail edge with WAF and private connectivity to payment dependencies."
                    : "Proposed consolidated App Service tier with direct SQL connectivity for faster initial rollout."
            ],
            EvidenceRefs = ["retail-policy-001"],
            Confidence = isHardened ? 0.88 : 0.72,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = DemoSeedSeederSupport.DemoUtc
        };

        await _deps.ResultRepository.CreateAsync(result, cancellationToken);
    }

    /// <summary>
    ///     Optional export <strong>history</strong> row for demos — not wired to consulting DOCX replay (no
    ///     AnalysisRequestJson).
    /// </summary>
    private async Task EnsureExportRecordCoreAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        if (await _deps.RunExportRecordRepository.GetByIdAsync(demo.ExportRecord, cancellationToken) is not null)
            return;
        RunExportRecord record = new()
        {
            ExportRecordId = demo.ExportRecord,
            RunId = demo.RunBaseline,
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "retail-baseline-architecture.md",
            TemplateProfile = "internal",
            TemplateProfileDisplayName = "Internal Technical Review",
            WasAutoSelected = false,
            ResolutionReason = "Demo seed export snapshot.",
            ManifestVersion = demo.ManifestBaseline,
            Notes = "Seeded by ArchLucid trusted baseline demo (export history only).",
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = DemoSeedSeederSupport.DemoUtc
        };
        await _deps.RunExportRecordRepository.CreateAsync(record, cancellationToken);
    }
}
