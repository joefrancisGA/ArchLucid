using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Bootstrap;

/// <summary>Fabricates Workspace A payloads (capture, evidence placeholders, governance-weighted findings, committed manifest).</summary>
internal static class ProductTourWorkspaceSeed
{
    private const string ManifestVersion = "northwind-product-tour-v1-manifest";
    private const string SystemName = "Contoso Cloud Platform";
    private static readonly DateTime SeedUtc = new(2026, 2, 10, 15, 0, 0, DateTimeKind.Utc);

    internal static DateTime SnapshotUtc => SeedUtc;

    internal static string ManifestVersionLiteral => ManifestVersion;

    internal static GoldenManifest BuildManifest(string legacyRunIdN)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags = ["ISO27001-aligned", "AI-Governance-Pack-A", "Security-Baseline-Pack-B"],
            PolicyConstraints =
            [
                "Private connectivity for inference endpoints where models access production data classifications",
                "Azure Policy deny rules for sovereign regions on training stores",
                "Conditional Access + MFA parity for privileged platform roles",
            ],
            RequiredControls = ["PrivateEndpoints", "KeyVaultIntegratedSecrets", "DefenderForCloud", "AzureMonitor"],
            RiskClassification = "Moderate",
            CostClassification = "Moderate",
        };

        const string svcApim = "svc-contoso-platform-apim";
        const string svcAcaWorkload = "svc-contoso-ai-batch";
        const string svcAoaiInfer = "svc-contoso-foundry-gateway";
        const string cosmosTraining = "ds-cosmos-ai-training-catalog";
        const string kvSecrets = "ds-kv-platform-secrets";
        List<ManifestService> services =
        [
            new()
            {
                ServiceId = svcApim,
                ServiceName = "Platform API Management",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ApiManagement,
                Purpose = "External REST façade for SaaS workloads and partner integrations.",
                Tags = ["public-edge"],
                RequiredControls = ["ManagedTls", "WafBaseline"],
            },
            new()
            {
                ServiceId = svcAcaWorkload,
                ServiceName = "AI Batch Workloads",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Scheduled GPU-friendly jobs that refresh retrieval indexes and KPI models.",
                Tags = ["internal-spoke", "pci-deferred-scope"],
                RequiredControls = ["ManagedIdentity"],
            },
            new()
            {
                ServiceId = svcAoaiInfer,
                ServiceName = "Azure OpenAI Gateway",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ManagedService,
                Purpose = "Policy-wrapped completions + embeddings routed through private egress.",
                Tags = ["ai-plane"],
                RequiredControls = ["PrivateLink", "ContentSafety"],
            },
        ];
        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = cosmosTraining,
                DatastoreName = "Cosmos DB — Synthetic Training Corpus",
                DatastoreType = DatastoreType.CosmosDb,
                RuntimePlatform = RuntimePlatform.CosmosDb,
                Purpose = "Partitioned corpus for responsibly redacted demos (no production PHI).",
            },
            new()
            {
                DatastoreId = kvSecrets,
                DatastoreName = "Key Vault — Platform Secrets",
                DatastoreType = DatastoreType.KeyVault,
                RuntimePlatform = RuntimePlatform.KeyVault,
                Purpose = "Holds ingestion keys, Cosmos connection strings, and Foundry credential bridges.",
            },
        ];
        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{svcApim}-calls-{svcAcaWorkload}",
                SourceId = svcApim,
                TargetId = svcAcaWorkload,
                RelationshipType = RelationshipType.Calls,
                Description = "Operational teams trigger ACA jobs through APIM-managed policies.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAcaWorkload}-writes-{cosmosTraining}",
                SourceId = svcAcaWorkload,
                TargetId = cosmosTraining,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Batch pipeline writes embedding refreshes after validation checkpoints.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAoaiInfer}-reads-{cosmosTraining}",
                SourceId = svcAoaiInfer,
                TargetId = cosmosTraining,
                RelationshipType = RelationshipType.ReadsFrom,
                Description = "Retrieval augmented generation consumes curated Cosmos partitions.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAoaiInfer}-authenticates-{kvSecrets}",
                SourceId = svcAoaiInfer,
                TargetId = kvSecrets,
                RelationshipType = RelationshipType.AuthenticatesWith,
                Description = "Gateway pulls inference keys exclusively from Managed Identity–scoped KV.",
            },
        ];

        return new GoldenManifest
        {
            RunId = legacyRunIdN,
            SystemName = SystemName,
            Services = services,
            Datastores = datastores,
            Relationships = relationships,
            Governance = gov,
            Metadata = new ManifestMetadata
            {
                ManifestVersion = ManifestVersion,
                ParentManifestVersion = null,
                ChangeDescription = "Synthetic Northwind Architects package for Workspace A Product Tour.",
                DecisionTraceIds = [],
                CreatedUtc = SeedUtc,
            },
        };
    }

    internal static IReadOnlyList<Finding> BuildFindings(Guid authorityRunGuid)
    {
        string suffix = authorityRunGuid.ToString("N");
        return new List<Finding>
        {
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-ingress",
                FindingType = nameof(ComplianceReview),
                Category = "SecurityArchitectureBaseline",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Container Apps external ingress exposes management APIs without segmented jump hosts",
                Rationale =
                    "Security baseline sec-base-003 expects internet-facing workloads to funnel admin traffic "
                    + "through private operational channels. Synthetic evidence shows ACA env accepting "
                    + "management callbacks from broadly scoped IP allow lists.",
                PolicyRuleId = "sec-base-003",
                RecommendedActions = ["Tighten ingress CIDR scopes", "Add JIT admin via Azure Bastion in peered spoke"],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["pack"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision: ACCEPT_RISK residual — Defender alert + weekly CAB attestation gates release.",
                ReviewedByUserId = "architecture.board@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-privatelink",
                FindingType = nameof(ComplianceReview),
                Category = "Networking",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "PaaS data planes lack uniform private-link enforcement templates",
                Rationale =
                    "sec-base-007 requires default-deny public endpoints where private connectivity exists. Evidence "
                    + "shows two subscriptions still allow optional public Cosmos endpoints for lab sandboxes.",
                PolicyRuleId = "sec-base-007",
                RecommendedActions =
                [
                    "Adopt reusable Bicep module that toggles deny public network per environment",
                    "Wire Azure Policy deploy-if-not-exists for zone redundant private endpoints",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["pack"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes =
                    "Decision: REMEDIATE — platform engineering merges template PR before evaluator tour refresh window.",
                ReviewedByUserId = "csp.platforms@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(12),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-kv-rotation",
                FindingType = nameof(ComplianceReview),
                Category = "Secrets",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "Key Vault purge protection disabled on non-prod clones used for demo tenants",
                Rationale =
                    "sec-base-012 expects parity between production and gated demo vaults — synthetic questionnaire "
                    + "captures clones without purge-protection to accelerate rebuilds.",
                PolicyRuleId = "sec-base-012",
                RecommendedActions =
                [
                    "Enable purge protection on clones that hydrate production-like datasets",
                    "Automate KV drift checks in weekly posture export",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["pack"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-log-forwarding",
                FindingType = nameof(OperationalReview),
                Category = "Observability",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Central SIEM ingestion delays exceed best-practice SLA for Tier-1 workloads",
                Rationale =
                    "sec-base-020 aligns with SIEM ingestion freshness windows; synthetic metrics show intermittent "
                    + "five-minute bursts still within tolerances but flagged for buyer storytelling.",
                PolicyRuleId = "sec-base-020",
                RecommendedActions =
                [
                    "Tune Event Hub throughput units ahead of evaluator peak load tests",
                    "Add workbook comparing SLA commitments vs routed logs",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["pack"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes =
                    "Decision: DEFER non-prod uplift — aligns with moderated risk acceptance until SKU refresh milestone.",
                ReviewedByUserId = "sre.observability@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(18),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-ai-review-gate",
                FindingType = nameof(ComplianceReview),
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Human escalation matrix missing after-hours reviewer for Tier-3 models",
                Rationale =
                    "ai-gov-008 expects dual-control human review readiness; synthetic questionnaire cites single "
                    + "duty engineer on-call Fridays.",
                PolicyRuleId = "ai-gov-008",
                RecommendedActions =
                [
                    "Add secondary reviewer routed via Entra privileged access groups",
                    "Publish SLA for human-in-loop acknowledgements inside manifest metadata",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["pack"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision: REMEDIATE — governance board schedules tabletop before external tour.",
                ReviewedByUserId = "trusted-ai.mesh@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(30),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-ai-model-registry",
                FindingType = nameof(ComplianceReview),
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Model versioning registry stalls on adapter-only deployments",
                Rationale =
                    "ai-gov-014 expects deterministic mapping between prompting adapters and audited base models "
                    + "— seeded evidence intentionally omits hashed adapter payloads for readability.",
                PolicyRuleId = "ai-gov-014",
                RecommendedActions =
                [
                    "Store adapter checksums alongside manifests",
                    "Sync weekly diff report for promoted LoRA weights",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["pack"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
        };
    }

    internal static IReadOnlyList<CanonicalObject> BuildSyntheticEvidenceObjects(Guid authorityRunGuid)
    {
        string seed = authorityRunGuid.ToString("N");
        return new List<CanonicalObject>
        {
            EvidenceDoc(
                seed,
                "northwind-azure-subscription-inventory.pdf",
                "Synthetic subscription inventory (App Service, Container Apps, Cosmos, Key Vault, APIM)."),
            EvidenceDoc(
                seed,
                "contoso-cloud-context-diagram-v3.pdf",
                "Logical diagram — Northwind overlay on Contoso Cloud Platform landing zones."),
            EvidenceDoc(
                seed,
                "northwind-decision-record-dr0029.pdf",
                "Decision record — network segmentation policy for AI batch spoke."),
            EvidenceDoc(
                seed,
                "security-questionnaire-responses-synthetic.xlsx",
                "Completed security questionnaire (synthetic answers for Pack B traceability)."),
            EvidenceDoc(
                seed,
                "responsible-ai-readiness-checklist.json",
                "EU AI Act + NIST AI RMF alignment checklist (Pack A mapping)."),
            EvidenceDoc(
                seed,
                "cost-footprint-estimate.md",
                "Illustrative FinOps summary for evaluation-only subscription SKUs."),
            EvidenceDoc(
                seed,
                "operational-runbook-excerpt.txt",
                "Synthetic operations excerpt showing alert routing for inference tier."),
        };
    }

    internal static GraphSnapshot BuildGraphSnapshot(Guid graphSnapshotId, Guid contextSnapshotId, Guid runId, DateTime createdUtc)
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = graphSnapshotId,
            ContextSnapshotId = contextSnapshotId,
            RunId = runId,
            CreatedUtc = createdUtc,
            Warnings = [],
        };
        graph.Nodes.AddRange(
        [
            new GraphNode
            {
                NodeId = "node-apim",
                NodeType = "gateway",
                Label = "API Management",
                Category = "edge",
                SourceType = "product-tour-seed",
                SourceId = "evidence-01",
            },
            new GraphNode
            {
                NodeId = "node-aca-batch",
                NodeType = "service",
                Label = "Container Apps — AI batch",
                Category = "compute",
                SourceType = "product-tour-seed",
                SourceId = "evidence-02",
            },
            new GraphNode
            {
                NodeId = "node-openai",
                NodeType = "service",
                Label = "Azure OpenAI gateway",
                Category = "ai",
                SourceType = "product-tour-seed",
                SourceId = "evidence-03",
            },
            new GraphNode
            {
                NodeId = "node-cosmos",
                NodeType = "datastore",
                Label = "Cosmos DB — training partitions",
                Category = "data",
                SourceType = "product-tour-seed",
                SourceId = "evidence-04",
            },
            new GraphNode
            {
                NodeId = "node-kv",
                NodeType = "security",
                Label = "Key Vault",
                Category = "secrets",
                SourceType = "product-tour-seed",
                SourceId = "evidence-05",
            },
        ]);
        graph.Edges.AddRange(
        [
            new GraphEdge { EdgeId = "edge-apim-aca", FromNodeId = "node-apim", ToNodeId = "node-aca-batch", EdgeType = "routesTo", Weight = 1 },
            new GraphEdge { EdgeId = "edge-aca-cosmos", FromNodeId = "node-aca-batch", ToNodeId = "node-cosmos", EdgeType = "writes", Weight = 1 },
            new GraphEdge { EdgeId = "edge-openai-cosmos", FromNodeId = "node-openai", ToNodeId = "node-cosmos", EdgeType = "readsFrom", Weight = 1 },
            new GraphEdge { EdgeId = "edge-openai-kv", FromNodeId = "node-openai", ToNodeId = "node-kv", EdgeType = "authenticatesWith", Weight = 1 },
        ]);

        return graph;
    }

    internal static AuthorityCommittedChainSeedCustomization BuildCustomization(Guid authorityRunGuid, Guid graphSnapshotId, Guid contextSnapshotId,
        DateTime snapshotUtc)
    {
        Guid runKey = authorityRunGuid;
        IReadOnlyList<string> auditNotes =
        [
            $"Decision ACCEPT_RISK (sec-base-003) — reviewer {authorityRunGuid:N[..8]}… accepted compensating controls with quarterly smoke proof.",
            "Decision REMEDIATE (sec-base-007 / ai-gov-008) — assign platform template backlog + Trusted AI playbook owners before GA tour refresh.",
            "Decision DEFER (sec-base-020) — lagging SIEM ingestion accepted for evaluator-only subscription (documented SLA variance).",
        ];

        GraphSnapshot graph = BuildGraphSnapshot(graphSnapshotId, contextSnapshotId, runKey, snapshotUtc);

        return new AuthorityCommittedChainSeedCustomization
        {
            AdditionalCanonicalObjects = BuildSyntheticEvidenceObjects(authorityRunGuid),
            AdditionalRuleAuditNotes = auditNotes,
            GraphSnapshotOverride = graph,
        };
    }

    private static CanonicalObject EvidenceDoc(string seed, string filename, string summary)
    {
        return new CanonicalObject
        {
            ObjectType = "evidence_attachment",
            Name = filename,
            SourceType = "product-tour-seed",
            SourceId = seed,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["format"] = Path.GetExtension(filename).TrimStart('.').ToLowerInvariant(),
                ["summary"] = summary,
                ["firm"] = "Northwind Architects (synthetic)",
            },
        };
    }

    /// <inheritdoc cref="BuildFindings(Guid)"/>
#pragma warning disable CA1034 // Nested type used only for manifest category constant readability
#pragma warning restore CA1034

    private static partial class ComplianceReview;

    private static partial class OperationalReview;
}
