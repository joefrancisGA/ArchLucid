using ArchLucid.Application.Analysis;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Bootstrap;

/// <summary>Meridian Alpine regulated demo payloads (Workspace B) — delegates manifest/findings to <see cref="RegulatedScenarioWorkspaceSeed" />.</summary>
internal static partial class MeridianAlpineWorkspaceSeed
{
    internal const string SystemName = "Alpine Patient Risk Scoring Platform";

    internal static ArchitectureRequest BuildArchitectureRequest(string requestId) =>
        new()
        {
            RequestId = requestId,
            Description =
                "Meridian Advisory Group leads a fabricated AI governance + security architecture review engagement for Alpine Health Innovations' "
                + "Patient Risk Scoring Platform — evaluator Workspace B storyline only.",
            SystemName = SystemName,
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Strictly synthetic regulated narrative — forbid ingest of customer PHI inside evaluator tenants",
                "Surface ai-gov-* and sec-base-* policy identifiers for procurement education",
                "Evidence artifacts are illustrative exports / matrices / questionnaires only",
            ],
        };

    internal static RunRecord BuildRunRecord(ScopeContext scope, Guid runGuid, string requestId) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = SystemName,
            Description =
                "Meridian Advisory Group (whitelabel) — Workspace B synthetic regulated AI governance review "
                + "for Alpine Health Innovations (patient risk scoring; PHI-free evaluator fixture).",
            CreatedUtc = RegulatedScenarioWorkspaceSeed.SnapshotUtc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
        };

    internal static (AgentTask Task, AgentResult Result) BuildTopologyWork(string runId, string demoSuffix)
    {
        string taskId = $"task-regulated-demo-topo-{demoSuffix}";
        string resultId = $"result-regulated-demo-topo-{demoSuffix}";
        DateTime utc = RegulatedScenarioWorkspaceSeed.SnapshotUtc;

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

        return (task, result);
    }

    internal static ArtifactBundle BuildArtifactBundle(
        ScopeContext scope,
        Guid runGuid,
        Guid manifestKey,
        Guid bundleId)
    {
        DateTime utc = RegulatedScenarioWorkspaceSeed.SnapshotUtc;

        return new ArtifactBundle
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = runGuid,
            ManifestId = manifestKey,
            CreatedUtc = utc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = DemoRegulatedScenarioWorkspaceIds.RegulatedDeliverableArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = manifestKey,
                    CreatedUtc = utc,
                    ArtifactType = ArtifactType.ArchitectureNarrative,
                    Name = "meridian-alpine-governance-board-sample.md",
                    Format = "text/markdown",
                    Content =
                        "# Architecture review board — synthetic whitelabel sample\n\n"
                        + "**Firm:** " + RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName + " (consultant)\\n"
                        + "**Engagement:** " + RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle + "\\n"
                        + "**Subject system:** " + SystemName + " — synthetic healthtech modernization (no PHI).\\n"
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
    }

    internal static RunExportRecord BuildExportRecord(Guid runGuid, Guid tenantId) =>
        new()
        {
            ExportRecordId = DemoRegulatedScenarioWorkspaceIds.ExportRecordId(tenantId).ToString("N"),
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
            AnalysisRequestJson = System.Text.Json.JsonSerializer.Serialize(
                BuildWorkspaceBPersistedExportHints(),
                DemoSeedSeederSupport.DemoExportPersistJsonOptions),
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = RegulatedScenarioWorkspaceSeed.SnapshotUtc,
        };

    private static PersistedAnalysisExportRequest BuildWorkspaceBPersistedExportHints() =>
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
}
