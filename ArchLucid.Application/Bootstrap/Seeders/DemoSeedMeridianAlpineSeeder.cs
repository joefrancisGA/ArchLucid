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

public sealed class DemoSeedMeridianAlpineSeeder: IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps;

    public DemoSeedMeridianAlpineSeeder(DemoSeedSeederDependencies deps)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
    }


    private static readonly string[] OwnedSteps = ["meridian-alpine-regulated"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "meridian-alpine-regulated" => EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(_deps.ScopeContextProvider.GetCurrentScope(), cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step.")
    };


    private async Task EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(ScopeContext contosoBaselineScope, CancellationToken cancellationToken)
    {
        if (contosoBaselineScope.TenantId != ScopeIds.DefaultTenant)
            return;

        Guid ws = DemoRegulatedScenarioWorkspaceIds.WorkspaceRowId(contosoBaselineScope.TenantId);
        Guid scopeProjectId = DemoRegulatedScenarioWorkspaceIds.ProjectScopeRowId(contosoBaselineScope.TenantId);
        ScopeContext workspaceScope =
            new()
            {
                TenantId = contosoBaselineScope.TenantId,
                WorkspaceId = ws,
                ProjectId = scopeProjectId
            };

        using (AmbientScopeContext.Push(workspaceScope))
            await EnsureMeridianAlpineRegulatedCommittedScenarioAsync(workspaceScope, cancellationToken);
    }

    private async Task EnsureMeridianAlpineRegulatedCommittedScenarioAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoRegulatedScenarioWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _deps.RunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is RunRecord existingTourRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingTourRun, cancellationToken);

            return;
        }

        string requestId = DemoRegulatedScenarioWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await EnsureArchitectureRequestAlpineRegulatedDemoAsync(requestId, cancellationToken);
        DateTime utc = RegulatedScenarioWorkspaceSeed.SnapshotUtc;
        string runId = runGuid.ToString("D");
        string demoSuffix = DemoSeedSeederSupport.ProductTourDemoSuffix(scope.TenantId);
        string taskId = $"task-regulated-demo-topo-{demoSuffix}";
        string resultId = $"result-regulated-demo-topo-{demoSuffix}";
        const string alpineSystemName = "Alpine Patient Risk Scoring Platform";

        RunRecord row = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = alpineSystemName,
            Description =
                "Meridian Advisory Group (whitelabel) — Workspace B synthetic regulated AI governance review "
                + "for Alpine Health Innovations (patient risk scoring; PHI-free evaluator fixture).",
            CreatedUtc = utc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
        };

        await _deps.RunRepository.SaveAsync(row, cancellationToken);

        AgentTask task = new()
        {
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective =
                "Synthetic capture of inference, training orchestration, and classified data lake partitions for evaluator governance storyline.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Topology),
            AllowedSources = [],
        };

        await _deps.TaskRepository.CreateManyAsync([task], cancellationToken);

        AgentResult result = new()
        {
            ResultId = resultId,
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims =
            [
                "Model serving + AML training subgraph aligned to seeded registry/classification attachments (synthetic tenant).",
                "Demonstrates Responsible AI governance signals without referencing real PHI.",
            ],
            EvidenceRefs = ["meridian-regulated-overview"],
            Confidence = 0.88,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };

        await _deps.ResultRepository.CreateAsync(result, cancellationToken);
        GoldenManifest manifest = RegulatedScenarioWorkspaceSeed.BuildManifest(runId);
        IReadOnlyList<Finding> findings = RegulatedScenarioWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(AuthorityDemoChainIds.Manifest(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.FindingsSnapshot(runGuid), AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = RegulatedScenarioWorkspaceSeed.BuildCustomization(runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid), utc);

        AuthorityManifestPersistResult persisted = await _deps.AuthorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, runGuid,
            alpineSystemName, manifest, chainIds, utc, richFindingsAndGraph: true, cancellationToken, connection: null, transaction: null,
            committedFindingsOverride: findings, seedCustomization: customization);

        await AuthorityCommittedChainDurableAudit.TryLogAsync(_deps.AuditService, _deps.ScopeContextProvider, _deps.ActorContext, _deps.Logger, runGuid,
            alpineSystemName, persisted, "regulated-scenario-demo-seed", richFindingsAndGraph: true, cancellationToken);

        Guid bundleId = DemoRegulatedScenarioWorkspaceIds.ArtifactBundleId(runGuid);

        ArtifactBundle bundle = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = runGuid,
            ManifestId = persisted.GoldenManifestId,
            CreatedUtc = utc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = DemoRegulatedScenarioWorkspaceIds.RegulatedDeliverableArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = persisted.GoldenManifestId,
                    CreatedUtc = utc,
                    ArtifactType = ArtifactType.ArchitectureNarrative,
                    Name = "meridian-alpine-governance-board-sample.md",
                    Format = "text/markdown",
                    Content =
                        "# Architecture review board — synthetic whitelabel sample\n\n"
                        + "**Firm:** " + RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName + " (consultant)\\n"
                        + "**Engagement:** " + RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle + "\\n"
                        + "**Subject system:** " + alpineSystemName + " — synthetic healthtech modernization (no PHI).\\n"
                        + "**Logo reference (opaque):** `" + RegulatedScenarioWorkspaceSeed.WhitelabelLogoBlobReference + "`\\n\\n"
                        + "Invoke architecture review board export with matching `WhitelabelConfiguration`; "
                        + "`dbo.RunExportRecords.AnalysisRequestJson` mirrors hints for tooling pre-fill.",
                    ContentHash = "sha256:regulated-scenario-whitelabel-seed-v1",
                    Metadata =
                        new Dictionary<string, string>(StringComparer.Ordinal)
                        {
                            ["workspace"] = "regulated-demo",
                            ["whitelabelFirm"] = RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName,
                            ["whitelabelEngagement"] = RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle,
                        },
                    ContributingDecisionIds = [],
                },
            ],
            Trace = new SynthesisTrace(),
        };

        await _deps.ArtifactBundleRepository.SaveAsync(bundle, cancellationToken);
        RunRecord? committed = await _deps.RunRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (committed is not null)
        {
            committed.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            committed.CurrentManifestVersion = RegulatedScenarioWorkspaceSeed.ManifestVersionLiteral;
            committed.CompletedUtc = utc;
            committed.ContextSnapshotId = persisted.ContextSnapshotId;
            committed.GraphSnapshotId = persisted.GraphSnapshotId;
            committed.FindingsSnapshotId = persisted.FindingsSnapshotId;
            committed.GoldenManifestId = persisted.GoldenManifestId;
            committed.DecisionTraceId = persisted.DecisionTraceId;
            committed.ArtifactBundleId = bundleId;
            await _deps.RunRepository.UpdateAsync(committed, cancellationToken);
        }

        await EnsureMeridianAlpineRegulatedExportStubAsync(runGuid, scope.TenantId, cancellationToken);

        if (_deps.Logger.IsEnabled(LogLevel.Information))
            _deps.Logger.LogInformation("Meridian Alpine regulated Workspace B seeded ({RunId}).", runGuid);
    }

    private async Task EnsureArchitectureRequestAlpineRegulatedDemoAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await _deps.RequestRepository.GetByIdAsync(requestId, cancellationToken) is not null)

            return;

        ArchitectureRequest architectureRequest = new()
        {
            RequestId = requestId,
            Description =
                "Meridian Advisory Group leads a fabricated AI governance + security architecture review engagement for Alpine Health Innovations' "
                + "Patient Risk Scoring Platform — evaluator Workspace B storyline only.",
            SystemName = "Alpine Patient Risk Scoring Platform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Strictly synthetic regulated narrative — forbid ingest of customer PHI inside evaluator tenants",
                "Surface ai-gov-* and sec-base-* policy identifiers for procurement education",
                "Evidence artifacts are illustrative exports / matrices / questionnaires only",
            ],
        };

        await _deps.RequestRepository.CreateAsync(architectureRequest, cancellationToken);
    }

    private async Task EnsureMeridianAlpineRegulatedExportStubAsync(Guid runGuid, Guid tenantId, CancellationToken cancellationToken)
    {
        string exportId = DemoRegulatedScenarioWorkspaceIds.ExportRecordId(tenantId).ToString("N");

        if (await _deps.RunExportRecordRepository.GetByIdAsync(exportId, cancellationToken) is not null)

            return;

        PersistedAnalysisExportRequest persistedHints = BuildWorkspaceBPersistedExportHints();

        RunExportRecord record = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "meridian-alpine-governance-board-sample.md",
            TemplateProfile = "regulated",
            TemplateProfileDisplayName = "Regulated review (Evaluator B)",
            WasAutoSelected = false,
            ResolutionReason =
                "Seeded Workspace B whitelabel + regulated profile hints for consulting exports / architecture review board UI pre-fill.",
            ManifestVersion = RegulatedScenarioWorkspaceSeed.ManifestVersionLiteral,
            Notes =
                "Workspace B export stub stores ReviewBoardWhitelabel* properties inside AnalysisRequestJson; logo bytes resolve from opaque LogoBlobReference in product hosts.",
            AnalysisRequestJson = JsonSerializer.Serialize(persistedHints, DemoSeedSeederSupport.DemoExportPersistJsonOptions),
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = RegulatedScenarioWorkspaceSeed.SnapshotUtc,
        };

        await _deps.RunExportRecordRepository.CreateAsync(record, cancellationToken);
    }

    private static PersistedAnalysisExportRequest BuildWorkspaceBPersistedExportHints()
    {
        PersistedAnalysisExportRequest request =
            new()
            {
                TemplateProfile = "regulated",
                Audience = "regulatory-review-board",
                ExternalDelivery = true,
                ExecutiveFriendly = false,
                RegulatedEnvironment = true,
                NeedDetailedEvidence = true,
                NeedExecutionTraces = false,
                NeedDeterminismOrCompareAppendices = false,
                IncludeEvidence = true,
                IncludeExecutionTraces = true,
                IncludeManifest = true,
                IncludeDiagram = false,
                IncludeSummary = true,
                IncludeDeterminismCheck = false,
                DeterminismIterations = 0,
                IncludeManifestCompare = false,
                CompareManifestVersion = null,
                IncludeAgentResultCompare = false,
                CompareRunId = null,
                ReviewBoardWhitelabelFirmDisplayName = RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName,
                ReviewBoardWhitelabelClientEngagementTitle = RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle,
                ReviewBoardWhitelabelLogoBlobReference = RegulatedScenarioWorkspaceSeed.WhitelabelLogoBlobReference,
                ReviewBoardWhitelabelFooterAttribution =
                    "Delivered by {FirmDisplayName} on behalf of Alpine Health Innovations (synthetic evaluator tenant)",
            };

        return request;
    }
}
