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
///     Retail Checkout Modernization trusted baseline: request, committed baseline and hardened runs,
///     topology task/result rows, manifest bodies, and the optional export-history row.
/// </summary>
public sealed partial class DemoSeedService
{
    private async Task EnsureRequestAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        if (await requestRepository.GetByIdAsync(demo.RequestId, cancellationToken) is not null)
            return;
        ArchitectureRequest request = new()
        {
            RequestId = demo.RequestId,
            Description = "Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries.",
            SystemName = "Retail Checkout Platform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Minimize public ingress", "Retain existing payment processor integration"]
        };
        await requestRepository.CreateAsync(request, cancellationToken);
    }

    private async Task EnsureCommittedRunAsync(ContosoRetailDemoIds demo, Guid authorityRunId, string taskId, string resultId, string manifestVersion,
        string traceId, bool isHardened, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        // Contract/API run ids use "N" (see ContosoRetailDemoIds); InMemory agent repos match RunId with Ordinal string equality.
        string runId = authorityRunId.ToString("N");

        if (await runRepository.GetByIdAsync(scope, authorityRunId, cancellationToken) is RunRecord existingRun)
        {
            await TryRepairSeededRunDescriptionAsync(existingRun, cancellationToken);
            await EnsureTopologyAgentArtifactsAsync(scope, runId, taskId, resultId, isHardened, cancellationToken);

            return;
        }

        RunRecord authorityRow = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = authorityRunId,
            ProjectId = "Retail Checkout Platform",
            Description =
                isHardened
                    ? "Demo — Retail hardened manifest (trusted baseline seed)."
                    : "Demo — Retail baseline manifest (trusted baseline seed).",
            CreatedUtc = DemoUtc,
            ArchitectureRequestId = demo.RequestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsSample = ShouldMarkSeededRunAsSample(scope.TenantId)
        };
        await runRepository.SaveAsync(authorityRow, cancellationToken);
        await EnsureTopologyAgentArtifactsAsync(scope, runId, taskId, resultId, isHardened, cancellationToken);
        bool richSeed = IsVerticalDemoSeedDepth(_demoOptions.CurrentValue.SeedDepth);
        GoldenManifest manifest = BuildManifest(runId, manifestVersion, isHardened, richSeed);
        AuthorityChainKeying chainKeying = new(AuthorityDemoChainIds.Manifest(authorityRunId), AuthorityDemoChainIds.ContextSnapshot(authorityRunId),
            AuthorityDemoChainIds.GraphSnapshot(authorityRunId), AuthorityDemoChainIds.FindingsSnapshot(authorityRunId),
            AuthorityDemoChainIds.DecisionTrace(authorityRunId));
        AuthorityManifestPersistResult authorityChain = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, authorityRunId,
            "Retail Checkout Platform", manifest, chainKeying, DemoUtc, richSeed, cancellationToken);
        await AuthorityCommittedChainDurableAudit.TryLogAsync(_auditService, scopeContextProvider, _actorContext, logger, authorityRunId,
            "Retail Checkout Platform", authorityChain, "demo-seed", richSeed, cancellationToken);
        // Decision-trace persistence happens inside PersistCommittedChainAsync above (AuthorityDecisionTrace
        // FK-chain row keyed by chainKeying.DecisionTraceId). The legacy second write to dbo.DecisionTraces
        // via ICoordinatorDecisionTraceRepository was removed in ADR 0030 PR A3 (2026-04-24) along with the
        // interface itself. The traceId / event-shape metadata is no longer surfaced for the demo seed because
        // ArchitectureRunDetail.DecisionTraces now reads from AuthorityDecisionTraces (see RunDetailQueryService).
        _ = traceId;
        RunRecord? authorityCommitted = await runRepository.GetByIdAsync(scope, authorityRunId, cancellationToken);

        if (authorityCommitted is not null)
        {
            authorityCommitted.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            authorityCommitted.CurrentManifestVersion = manifestVersion;
            authorityCommitted.CompletedUtc = DemoUtc;
            authorityCommitted.ContextSnapshotId = authorityChain.ContextSnapshotId;
            authorityCommitted.GraphSnapshotId = authorityChain.GraphSnapshotId;
            authorityCommitted.FindingsSnapshotId = authorityChain.FindingsSnapshotId;
            authorityCommitted.GoldenManifestId = authorityChain.GoldenManifestId;
            authorityCommitted.DecisionTraceId = authorityChain.DecisionTraceId;
            await runRepository.UpdateAsync(authorityCommitted, cancellationToken);
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
        IReadOnlyList<AgentResult> existingResults = await _resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (existingResults.Count > 0)
            return;

        IReadOnlyList<AgentTask> existingTasks = await _taskRepository.GetByRunIdAsync(scope, runId, cancellationToken);

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
                CreatedUtc = DemoUtc,
                CompletedUtc = DemoUtc,
                EvidenceBundleRef = null,
                AllowedTools = SeedAllowedTools(AgentType.Topology),
                AllowedSources = []
            };

            await _taskRepository.CreateManyAsync([task], cancellationToken);
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
            CreatedUtc = DemoUtc
        };

        await _resultRepository.CreateAsync(result, cancellationToken);
    }


    private static GoldenManifest BuildManifest(string runId, string manifestVersion, bool isHardened, bool richSeed)
    {
        ManifestGovernance gov = isHardened
            ? new ManifestGovernance
            {
                ComplianceTags = ["PCI-DSS", "SOC2"],
                PolicyConstraints = ["No public SQL endpoints", "Secrets in Key Vault only"],
                RequiredControls = ["WAF", "PrivateLink", "DefenderForCloud"],
                RiskClassification = "Moderate",
                CostClassification = "Moderate"
            }
            : new ManifestGovernance
            {
                ComplianceTags = ["PCI-DSS"],
                PolicyConstraints = ["HTTPS only"],
                RequiredControls = ["TLS-1.2"],
                RiskClassification = "High",
                CostClassification = "Low"
            };
        // ADR 0030 owner Decision B (2026-04-23): quickstart writes one-of-each minimum (single
        // service + datastore + relationship); vertical writes the production-realistic depth
        // (multiple services + datastore + relationships including a service-to-service edge).
        string checkoutServiceId = isHardened ? "svc-checkout-api-v2" : "svc-checkout-api-v1";
        string ordersDatastoreId = isHardened ? "ds-orders-v2" : "ds-orders-v1";
        List<ManifestService> services =
        [
            new()
            {
                ServiceId = checkoutServiceId,
                ServiceName = "Checkout API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = isHardened ? RuntimePlatform.ContainerApps : RuntimePlatform.AppService,
                Purpose = "Orchestrates cart and payment initiation.",
                Tags = isHardened ? ["edge-hardened"] : ["legacy-monolith"],
                RequiredControls = isHardened ? ["WAF", "ManagedIdentity"] : ["BasicAuthOff"]
            }
        ];
        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = ordersDatastoreId,
                DatastoreName = "Orders DB",
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer,
                Purpose = "Order and payment state."
            }
        ];
        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{checkoutServiceId}-writes-{ordersDatastoreId}",
                SourceId = checkoutServiceId,
                TargetId = ordersDatastoreId,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Checkout API persists order and payment state."
            }
        ];

        if (!richSeed)
            return new GoldenManifest
            {
                RunId = runId,
                SystemName = "Retail Checkout Platform",
                Services = services,
                Datastores = datastores,
                Relationships = relationships,
                Governance = gov,
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = manifestVersion,
                    ParentManifestVersion = null,
                    ChangeDescription = isHardened ? "Hardened retail posture" : "Baseline lift-and-shift",
                    DecisionTraceIds = [],
                    CreatedUtc = DemoUtc
                }
            };
        string paymentServiceId = isHardened ? "svc-payment-gateway-v2" : "svc-payment-gateway-v1";
        services.Add(new ManifestService
        {
            ServiceId = paymentServiceId,
            ServiceName = "Payment Gateway",
            ServiceType = ServiceType.Api,
            RuntimePlatform = isHardened ? RuntimePlatform.ContainerApps : RuntimePlatform.AppService,
            Purpose = "Tokenizes card data and brokers payment provider calls.",
            Tags = isHardened ? ["edge-hardened", "pci-scope"] : ["pci-scope"],
            RequiredControls = isHardened ? ["WAF", "ManagedIdentity", "PrivateLink"] : ["TLS-1.2"]
        });
        relationships.Add(new ManifestRelationship
        {
            RelationshipId = $"rel-{checkoutServiceId}-calls-{paymentServiceId}",
            SourceId = checkoutServiceId,
            TargetId = paymentServiceId,
            RelationshipType = RelationshipType.Calls,
            Description = "Checkout API invokes the Payment Gateway during order finalization."
        });
        relationships.Add(new ManifestRelationship
        {
            RelationshipId = $"rel-{paymentServiceId}-reads-{ordersDatastoreId}",
            SourceId = paymentServiceId,
            TargetId = ordersDatastoreId,
            RelationshipType = RelationshipType.ReadsFrom,
            Description = "Payment Gateway reads order context for reconciliation."
        });
        return new GoldenManifest
        {
            RunId = runId,
            SystemName = "Retail Checkout Platform",
            Services = services,
            Datastores = datastores,
            Relationships = relationships,
            Governance = gov,
            Metadata = new ManifestMetadata
            {
                ManifestVersion = manifestVersion,
                ParentManifestVersion = null,
                ChangeDescription = isHardened ? "Hardened retail posture" : "Baseline lift-and-shift",
                DecisionTraceIds = [],
                CreatedUtc = DemoUtc
            }
        };
    }


    /// <summary>
    ///     Optional export <strong>history</strong> row for demos — not wired to consulting DOCX replay (no
    ///     AnalysisRequestJson).
    /// </summary>
    private async Task EnsureExportRecordAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        if (await runExportRecordRepository.GetByIdAsync(demo.ExportRecord, cancellationToken) is not null)
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
            CreatedUtc = DemoUtc
        };
        await runExportRecordRepository.CreateAsync(record, cancellationToken);
    }
}
