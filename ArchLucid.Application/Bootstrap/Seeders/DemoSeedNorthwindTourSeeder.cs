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

public sealed class DemoSeedNorthwindTourSeeder: IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps;

    public DemoSeedNorthwindTourSeeder(DemoSeedSeederDependencies deps)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
    }


    private static readonly string[] OwnedSteps = ["northwind-product-tour"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "northwind-product-tour" => EnsureNorthwindProductTourWorkspaceSeedAsync(_deps.ScopeContextProvider.GetCurrentScope(), cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step.")
    };


    private async Task EnsureNorthwindProductTourWorkspaceSeedAsync(ScopeContext contosoBaselineScope, CancellationToken cancellationToken)
    {
        if (contosoBaselineScope.TenantId != ScopeIds.DefaultTenant)

            return;

        Guid ws = DemoTourWorkspaceIds.WorkspaceRowId(contosoBaselineScope.TenantId);
        Guid scopeProjectId = DemoTourWorkspaceIds.ProjectScopeRowId(contosoBaselineScope.TenantId);
        ScopeContext workspaceScope =
            new()
            {
                TenantId = contosoBaselineScope.TenantId,
                WorkspaceId = ws,
                ProjectId = scopeProjectId
            };

        using (AmbientScopeContext.Push(workspaceScope))

            await EnsureNorthwindProductTourCommittedScenarioAsync(workspaceScope, cancellationToken);
    }

    private async Task EnsureNorthwindProductTourCommittedScenarioAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoTourWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _deps.RunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is RunRecord existingTourRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingTourRun, cancellationToken);

            return;
        }

        string requestId = DemoTourWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await EnsureArchitectureRequestNorthwindTourAsync(requestId, cancellationToken);
        DateTime utc = ProductTourWorkspaceSeed.SnapshotUtc;
        string runId = runGuid.ToString("D");
        string demoSuffix = DemoSeedSeederSupport.ProductTourDemoSuffix(scope.TenantId);
        string taskId = $"task-product-tour-topo-{demoSuffix}";
        string resultId = $"result-product-tour-topo-{demoSuffix}";
        RunRecord row = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = "Cloud Platform",
            Description = "Product Tour — Workspace A (synthetic Cloud Platform review).",
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
            Objective = "Demonstrate authoritative capture→evidence→findings→decisions spine for evaluator tour.",
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
                "Synthetic APIM + ACA + Cosmos + KV topology aligned to seeded evidence attachments.",
                "Product Tour engagement shell reviews platform modernization boundaries without invoking customer payloads.",
            ],
            EvidenceRefs = ["product-tour-overview"],
            Confidence = 0.9,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };

        await _deps.ResultRepository.CreateAsync(result, cancellationToken);
        GoldenManifest manifest = ProductTourWorkspaceSeed.BuildManifest(runId);
        IReadOnlyList<Finding> findings = ProductTourWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(AuthorityDemoChainIds.Manifest(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.FindingsSnapshot(runGuid), AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = ProductTourWorkspaceSeed.BuildCustomization(runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid), utc);

        AuthorityManifestPersistResult persisted = await _deps.AuthorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, runGuid, "Cloud Platform",
            manifest, chainIds, utc, richFindingsAndGraph: true, cancellationToken, connection: null, transaction: null, committedFindingsOverride: findings,
            seedCustomization: customization);

        await AuthorityCommittedChainDurableAudit.TryLogAsync(_deps.AuditService, _deps.ScopeContextProvider, _deps.ActorContext, _deps.Logger, runGuid,
            "Cloud Platform", persisted, "product-tour-demo-seed", richFindingsAndGraph: true, cancellationToken);

        Guid bundleId = DemoTourWorkspaceIds.ArtifactBundleId(runGuid);
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
                    ArtifactId = DemoTourWorkspaceIds.TourReportArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = persisted.GoldenManifestId,
                    CreatedUtc = utc,
                    ArtifactType = ArtifactType.ArchitectureNarrative,
                    Name = "product-tour-architecture-review-sample.md",
                    Format = "text/markdown",
                    Content =
                        "# Architecture review tour — synthetic export scaffold\n\n"
                        + "**Reviewer firm:** Product Tour reviewer (fabricated)\\n\\n"
                        + "**Subject system:** Cloud Platform (synthetic modernization narrative)\\n\\n"
                        + "Demonstrates how evaluators finalize a workspace and initiate export without mutating seeded authority rows.",
                    ContentHash = "sha256:product-tour-export-seed-v1",
                    Metadata = new Dictionary<string, string> { ["workspace"] = "product-tour" },
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
            committed.CurrentManifestVersion = ProductTourWorkspaceSeed.ManifestVersionLiteral;
            committed.CompletedUtc = utc;
            committed.ContextSnapshotId = persisted.ContextSnapshotId;
            committed.GraphSnapshotId = persisted.GraphSnapshotId;
            committed.FindingsSnapshotId = persisted.FindingsSnapshotId;
            committed.GoldenManifestId = persisted.GoldenManifestId;
            committed.DecisionTraceId = persisted.DecisionTraceId;
            committed.ArtifactBundleId = bundleId;
            await _deps.RunRepository.UpdateAsync(committed, cancellationToken);
        }

        await EnsureNorthwindTourExportStubAsync(runGuid, scope.TenantId, cancellationToken);

        if (_deps.Logger.IsEnabled(LogLevel.Information))
            _deps.Logger.LogInformation("Product Tour Workspace A seeded ({RunId}).", runGuid);
    }

    private async Task EnsureArchitectureRequestNorthwindTourAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await _deps.RequestRepository.GetByIdAsync(requestId, cancellationToken) is not null)

            return;

        ArchitectureRequest architectureRequest = new()
        {
            RequestId = requestId,
            Description =
                "A fabricated Product Tour reviewer conducts a synthetic architecture review engagement for "
                + "the Cloud Platform modernization backlog — onboarding Product Tour storyline only.",
            SystemName = "Cloud Platform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Maintain evaluation-mode synthetic content only — no linkage to buyer production subscriptions",
                "Expose Pack A/B rule identifiers for evaluator education",
                "Evidence attachments are illustrative PDF/JSON placeholders",
            ],
        };

        await _deps.RequestRepository.CreateAsync(architectureRequest, cancellationToken);
    }

    private async Task EnsureNorthwindTourExportStubAsync(Guid runGuid, Guid tenantId, CancellationToken cancellationToken)
    {
        string exportId = DemoTourWorkspaceIds.ExportRecordId(tenantId).ToString("N");

        if (await _deps.RunExportRecordRepository.GetByIdAsync(exportId, cancellationToken) is not null)

            return;

        RunExportRecord record = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "product-tour-architecture-review-sample.md",
            TemplateProfile = "trial",
            TemplateProfileDisplayName = "Buyer-safe tour export",
            WasAutoSelected = false,
            ResolutionReason = "Demonstrates evaluator export workflow without invoking paid synthesis.",
            ManifestVersion = ProductTourWorkspaceSeed.ManifestVersionLiteral,
            Notes =
                "Seeded Workspace A artifact — regenerate after tour refresh milestones. dbo.TenantWorkspaces.IsDemoWorkspace=1 excludes fixture from SKU math once billing gates honor the flag.",
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = ProductTourWorkspaceSeed.SnapshotUtc,
        };

        await _deps.RunExportRecordRepository.CreateAsync(record, cancellationToken);
    }
}
