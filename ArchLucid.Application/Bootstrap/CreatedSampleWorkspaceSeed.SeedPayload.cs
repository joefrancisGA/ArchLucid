using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Bootstrap;

internal static partial class CreatedSampleWorkspaceSeed
{
    internal static ArchitectureRequest BuildArchitectureRequest(string requestId) =>
        new()
        {
            RequestId = requestId,
            Description =
                "Enterprise sample (fictional) internal copilot over corporate docs — APIM, Azure OpenAI, AI Search RAG, "
                + "content safety, and prompt governance. Born-governed created package sample only.",
            SystemName = SystemNameLiteral,
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

    internal static RunRecord BuildRunRecord(ScopeContext scope, Guid runGuid, string requestId, bool isSample) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = SystemNameLiteral,
            Description = "Enterprise Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample).",
            CreatedUtc = SnapshotUtc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsSample = isSample,
            PackageOrigin = ArchitecturePackageOrigin.Created,
        };

    internal static (IReadOnlyList<AgentTask> Tasks, IReadOnlyList<AgentResult> Results) BuildAgentWork(
        string runId,
        string demoSuffix)
    {
        string topoTaskId = $"task-created-sample-topo-{demoSuffix}";
        string costTaskId = $"task-created-sample-cost-{demoSuffix}";
        string compTaskId = $"task-created-sample-comp-{demoSuffix}";
        string criticTaskId = $"task-created-sample-critic-{demoSuffix}";
        string topoResultId = $"result-created-sample-topo-{demoSuffix}";
        string costResultId = $"result-created-sample-cost-{demoSuffix}";
        string compResultId = $"result-created-sample-comp-{demoSuffix}";
        string criticResultId = $"result-created-sample-critic-{demoSuffix}";
        DateTime utc = SnapshotUtc;

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
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Topology),
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
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Cost),
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
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Compliance),
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
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Critic),
            AllowedSources = [],
        };

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

        return (
            [topoTask, costTask, compTask, criticTask],
            [topoResult, costResult, compResult, criticResult]);
    }

    internal static ArtifactBundle BuildArtifactBundle(
        ScopeContext scope,
        Guid runGuid,
        Guid manifestKey,
        Guid bundleId) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = runGuid,
            ManifestId = manifestKey,
            CreatedUtc = SnapshotUtc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = DemoCreatedSampleWorkspaceIds.CreatedPackageArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = manifestKey,
                    CreatedUtc = SnapshotUtc,
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

    internal static RunExportRecord BuildExportRecord(Guid runGuid, Guid tenantId) =>
        new()
        {
            ExportRecordId = DemoCreatedSampleWorkspaceIds.ExportRecordId(tenantId).ToString("N"),
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "enterprise-copilot-created-package-sample.md",
            TemplateProfile = "trial",
            TemplateProfileDisplayName = "Born-governed created package export",
            WasAutoSelected = false,
            ResolutionReason = "Demonstrates created-package export workflow without invoking paid synthesis.",
            ManifestVersion = ManifestVersionLiteral,
            Notes =
                "Seeded created architecture package sample — regenerate after showcase refresh milestones.",
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = SnapshotUtc,
        };
}
