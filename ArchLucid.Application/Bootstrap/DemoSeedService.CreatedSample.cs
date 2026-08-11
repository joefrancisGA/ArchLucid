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
///     Created-architecture-package sample workspace used by the create-object walkthrough.
/// </summary>
public sealed partial class DemoSeedService
{
    private async Task EnsureCreatedArchitecturePackageSampleAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoCreatedSampleWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken) is RunRecord existingCreatedSampleRun)
        {
            await TryRepairSeededRunDescriptionAsync(existingCreatedSampleRun, cancellationToken);

            return;
        }

        string requestId = DemoCreatedSampleWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await EnsureArchitectureRequestCreatedSampleAsync(requestId, cancellationToken);
        DateTime utc = CreatedSampleWorkspaceSeed.SnapshotUtc;
        string runId = runGuid.ToString("D");
        string demoSuffix = ProductTourDemoSuffix(scope.TenantId);
        string topoTaskId = $"task-created-sample-topo-{demoSuffix}";
        string costTaskId = $"task-created-sample-cost-{demoSuffix}";
        string compTaskId = $"task-created-sample-comp-{demoSuffix}";
        string criticTaskId = $"task-created-sample-critic-{demoSuffix}";
        string topoResultId = $"result-created-sample-topo-{demoSuffix}";
        string costResultId = $"result-created-sample-cost-{demoSuffix}";
        string compResultId = $"result-created-sample-comp-{demoSuffix}";
        string criticResultId = $"result-created-sample-critic-{demoSuffix}";
        const string systemName = "Enterprise.Copilot.RagPlatform";

        RunRecord row = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = systemName,
            Description = "Enterprise Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample).",
            CreatedUtc = utc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsSample = ShouldMarkSeededRunAsSample(scope.TenantId),
            PackageOrigin = ArchitecturePackageOrigin.Created,
        };

        await _runRepository.SaveAsync(row, cancellationToken);
        AgentTask topoTask = new()
        {
            TaskId = topoTaskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective =
                "Propose APIM-fronted copilot orchestration with private Azure OpenAI, AI Search RAG, and redacted audit logging.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Topology),
            AllowedSources = [],
        };
        AgentTask costTask = new()
        {
            TaskId = costTaskId,
            RunId = runId,
            AgentType = AgentType.Cost,
            Objective =
                "Estimate monthly run-rate for APIM, Container Apps orchestration, AI Search units, and Azure OpenAI PTU/consumption mix.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Cost),
            AllowedSources = [],
        };
        AgentTask compTask = new()
        {
            TaskId = compTaskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Objective =
                "Validate content-safety hooks, private endpoint posture, prompt-governance pipeline, and redacted session audit retention.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Compliance),
            AllowedSources = [],
        };
        AgentTask criticTask = new()
        {
            TaskId = criticTaskId,
            RunId = runId,
            AgentType = AgentType.Critic,
            Objective = "Stress-test grounding claims and highlight evidence gaps before package finalization.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Critic),
            AllowedSources = [],
        };

        await _taskRepository.CreateManyAsync([topoTask, costTask, compTask, criticTask], cancellationToken);
        AgentResult topoResult = new()
        {
            ResultId = topoResultId,
            TaskId = topoTaskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims =
            [
                "APIM + WAF terminates TLS; chat orchestration on Container Apps; RAG via private AI Search; completions through private Azure OpenAI.",
                "Tool-calling to line-of-business APIs stays behind managed identity and explicit human confirm gates for high-impact actions.",
            ],
            EvidenceRefs = ["created-sample-topology-overview"],
            Confidence = 0.88,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };
        AgentResult costResult = new()
        {
            ResultId = costResultId,
            TaskId = costTaskId,
            RunId = runId,
            AgentType = AgentType.Cost,
            Claims =
            [
                "Illustrative run-rate bands APIM Standard + ACA consumption + AI Search S1 + Azure OpenAI pay-as-you-go with dev mirrors.",
            ],
            EvidenceRefs = ["created-sample-cost-estimate"],
            Confidence = 0.82,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };
        AgentResult compResult = new()
        {
            ResultId = compResultId,
            TaskId = compTaskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Claims =
            [
                "Content safety and private-link posture align to responsible-AI starter pack with documented prompt-governance pipeline.",
            ],
            EvidenceRefs = ["created-sample-compliance-checklist"],
            Confidence = 0.86,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };
        AgentResult criticResult = new()
        {
            ResultId = criticResultId,
            TaskId = criticTaskId,
            RunId = runId,
            AgentType = AgentType.Critic,
            Claims =
            [
                "Grounding is asserted for retrieval paths; speculative completion risk called out where evidence is thin.",
            ],
            EvidenceRefs = ["created-sample-critic-review"],
            Confidence = 0.8,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };

        await _resultRepository.CreateManyAsync([topoResult, costResult, compResult, criticResult], cancellationToken);
        GoldenManifest manifest = CreatedSampleWorkspaceSeed.BuildManifest(runId);
        IReadOnlyList<Finding> findings = CreatedSampleWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(
            AuthorityDemoChainIds.Manifest(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.FindingsSnapshot(runGuid),
            AuthorityDemoChainIds.DecisionTrace(runGuid));
        AuthorityCommittedChainSeedCustomization customization = CreatedSampleWorkspaceSeed.BuildCustomization(
            runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            utc);

        AuthorityManifestPersistResult persisted = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(
            scope,
            runGuid,
            systemName,
            manifest,
            chainIds,
            utc,
            richFindingsAndGraph: true,
            cancellationToken,
            connection: null,
            transaction: null,
            committedFindingsOverride: findings,
            seedCustomization: customization);

        await AuthorityCommittedChainDurableAudit.TryLogAsync(
            _auditService,
            _scopeContextProvider,
            _actorContext,
            logger,
            runGuid,
            systemName,
            persisted,
            "created-sample-demo-seed",
            richFindingsAndGraph: true,
            cancellationToken);

        Guid bundleId = DemoCreatedSampleWorkspaceIds.ArtifactBundleId(runGuid);
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
                    ArtifactId = DemoCreatedSampleWorkspaceIds.CreatedPackageArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = persisted.GoldenManifestId,
                    CreatedUtc = utc,
                    ArtifactType = ArtifactType.ArchitectureNarrative,
                    Name = "enterprise-copilot-created-package-sample.md",
                    Format = "text/markdown",
                    Content =
                        "# Created architecture package — synthetic export scaffold\n\n"
                        + "**Organization:** Enterprise sample (fabricated)\\n\\n"
                        + "**System:** Enterprise.Copilot.RagPlatform\\n\\n"
                        + "Demonstrates a born-governed package produced from guided intake — findings, manifest, and export without a separate review pass.",
                    ContentHash = "sha256:created-sample-export-seed-v1",
                    Metadata = new Dictionary<string, string> { ["workspace"] = "created-sample" },
                    ContributingDecisionIds = [],
                },
            ],
            Trace = new SynthesisTrace(),
        };

        await _artifactBundleRepository.SaveAsync(bundle, cancellationToken);
        RunRecord? committed = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (committed is not null)
        {
            committed.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            committed.CurrentManifestVersion = CreatedSampleWorkspaceSeed.ManifestVersionLiteral;
            committed.CompletedUtc = utc;
            committed.ContextSnapshotId = persisted.ContextSnapshotId;
            committed.GraphSnapshotId = persisted.GraphSnapshotId;
            committed.FindingsSnapshotId = persisted.FindingsSnapshotId;
            committed.GoldenManifestId = persisted.GoldenManifestId;
            committed.DecisionTraceId = persisted.DecisionTraceId;
            committed.ArtifactBundleId = bundleId;
            await _runRepository.UpdateAsync(committed, cancellationToken);
        }

        await EnsureCreatedSampleExportStubAsync(runGuid, scope.TenantId, cancellationToken);

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Created architecture package sample seeded ({RunId}).", runGuid);
    }

    private async Task EnsureArchitectureRequestCreatedSampleAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await requestRepository.GetByIdAsync(requestId, cancellationToken) is not null)
            return;

        ArchitectureRequest architectureRequest = new()
        {
            RequestId = requestId,
            Description =
                "Enterprise sample (fictional) internal copilot over corporate docs — APIM, Azure OpenAI, AI Search RAG, "
                + "content safety, and prompt governance. Born-governed created package sample only.",
            SystemName = "Enterprise.Copilot.RagPlatform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            RequestSource = "draft-intake",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
            Constraints =
            [
                "All inference and search data planes use private connectivity from the application VNet",
                "System prompts and tool manifests change only through approved pipeline",
                "PII and secrets must not appear in vector index — ingestion pipeline enforces redaction patterns (design intent)",
            ],
        };

        await requestRepository.CreateAsync(architectureRequest, cancellationToken);
    }

    private async Task EnsureCreatedSampleExportStubAsync(Guid runGuid, Guid tenantId, CancellationToken cancellationToken)
    {
        string exportId = DemoCreatedSampleWorkspaceIds.ExportRecordId(tenantId).ToString("N");

        if (await runExportRecordRepository.GetByIdAsync(exportId, cancellationToken) is not null)
            return;

        RunExportRecord record = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "enterprise-copilot-created-package-sample.md",
            TemplateProfile = "trial",
            TemplateProfileDisplayName = "Born-governed created package export",
            WasAutoSelected = false,
            ResolutionReason = "Demonstrates created-package export workflow without invoking paid synthesis.",
            ManifestVersion = CreatedSampleWorkspaceSeed.ManifestVersionLiteral,
            Notes =
                "Seeded created architecture package sample — regenerate after showcase refresh milestones.",
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = CreatedSampleWorkspaceSeed.SnapshotUtc,
        };

        await runExportRecordRepository.CreateAsync(record, cancellationToken);
    }
}
