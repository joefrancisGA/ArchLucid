using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Bootstrap;

/// <summary>Northwind product tour payloads (Workspace A) — delegates manifest/findings to <see cref="ProductTourWorkspaceSeed" />.</summary>
internal static partial class NorthwindTourWorkspaceSeed
{
    internal const string SystemName = "Cloud Platform";

    internal static ArchitectureRequest BuildArchitectureRequest(string requestId) =>
        new()
        {
            RequestId = requestId,
            Description =
                "A fabricated Product Tour reviewer conducts a synthetic architecture review engagement for "
                + "the Cloud Platform modernization backlog — onboarding Product Tour storyline only.",
            SystemName = SystemName,
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Maintain evaluation-mode synthetic content only — no linkage to buyer production subscriptions",
                "Expose Pack A/B rule identifiers for evaluator education",
                "Evidence attachments are illustrative PDF/JSON placeholders",
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
            Description = "Product Tour — Workspace A (synthetic Cloud Platform review).",
            CreatedUtc = ProductTourWorkspaceSeed.SnapshotUtc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
        };

    internal static (AgentTask Task, AgentResult Result) BuildTopologyWork(string runId, string demoSuffix)
    {
        string taskId = $"task-product-tour-topo-{demoSuffix}";
        string resultId = $"result-product-tour-topo-{demoSuffix}";
        DateTime utc = ProductTourWorkspaceSeed.SnapshotUtc;

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

        return (task, result);
    }

    internal static ArtifactBundle BuildArtifactBundle(
        ScopeContext scope,
        Guid runGuid,
        Guid manifestKey,
        Guid bundleId)
    {
        DateTime utc = ProductTourWorkspaceSeed.SnapshotUtc;

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
                    ArtifactId = DemoTourWorkspaceIds.TourReportArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = manifestKey,
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
    }

    internal static RunExportRecord BuildExportRecord(Guid runGuid, Guid tenantId) =>
        new()
        {
            ExportRecordId = DemoTourWorkspaceIds.ExportRecordId(tenantId).ToString("N"),
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
}
