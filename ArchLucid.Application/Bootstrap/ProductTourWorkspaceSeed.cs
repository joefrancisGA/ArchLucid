using System.IO;

using ArchLucid.Application.Authority;
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
                "Private connectivity for inference endpoints where models access production-tagged data classifications",
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
                ServiceType = ServiceType.Integration,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "External REST façade for SaaS workloads (synthetic demonstration).",
                Tags = ["public-edge"],
                RequiredControls = ["ManagedTls", "WafBaseline"],
            },
            new()
            {
                ServiceId = svcAcaWorkload,
                ServiceName = "AI Batch Workloads",
                ServiceType = ServiceType.Worker,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Scheduled embeddings refresh jobs on Container Apps profiles.",
                Tags = ["internal-spoke"],
                RequiredControls = ["ManagedIdentity"],
            },
            new()
            {
                ServiceId = svcAoaiInfer,
                ServiceName = "Azure OpenAI Gateway",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.AzureOpenAi,
                Purpose = "Policy-gated completions and embeddings routed through private egress endpoints.",
                Tags = ["ai-plane"],
                RequiredControls = ["PrivateLink"],
            },
        ];

        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = cosmosTraining,
                DatastoreName = "Cosmos DB — Synthetic Training Corpus",
                DatastoreType = DatastoreType.NoSql,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Partitioned corpus catalog for responsibly redacted demo tenants (no PHI).",
            },
            new()
            {
                DatastoreId = kvSecrets,
                DatastoreName = "Key Vault — Platform Secrets",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.KeyVault,
                Purpose = "Secrets bridge for ingestion keys + Foundry-managed credentials.",
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
                Description = "Operational personas trigger ACA jobs through APIM policies.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAcaWorkload}-writes-{cosmosTraining}",
                SourceId = svcAcaWorkload,
                TargetId = cosmosTraining,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Batch workloads publish validated embedding deltas into Cosmos partitions.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAoaiInfer}-reads-{cosmosTraining}",
                SourceId = svcAoaiInfer,
                TargetId = cosmosTraining,
                RelationshipType = RelationshipType.ReadsFrom,
                Description = "Retrieval workflows pull curated subsets for completions.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAoaiInfer}-authenticates-{kvSecrets}",
                SourceId = svcAoaiInfer,
                TargetId = kvSecrets,
                RelationshipType = RelationshipType.AuthenticatesWith,
                Description = "Gateway authenticates outbound calls using KV-backed secrets exclusively.",
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
                ChangeDescription = "Synthetic Northwind Architects package — Workspace A self-demo tour.",
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
                FindingType = "ComplianceReview",
                Category = "SecurityArchitectureBaseline",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Container Apps external ingress exposes admin callbacks without segmented jump-host paths",
                Rationale =
                    "Security baseline rule sec-base-003 expects hardened ingress for admin-plane traffic. Demonstration attachments "
                    + "summarize ACA environments that still advertise broad interim allowlists while migration completes.",
                PolicyRuleId = "sec-base-003",
                RecommendedActions = ["Shrink allowlisted source ranges", "Add JIT admin hops via bastion-aligned spoke subnets"],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision ACCEPT_RISK with Defender alert + CAB attestation prerequisites.",
                ReviewedByUserId = "architecture.board@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-privatelink",
                FindingType = "ComplianceReview",
                Category = "Networking",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "PaaS data planes inconsistently invoke private endpoints across demo subscriptions",
                Rationale =
                    "Rule sec-base-007 flags optional public Cosmos endpoints lingering in mirrored sandboxes alongside production peers.",
                PolicyRuleId = "sec-base-007",
                RecommendedActions =
                [
                    "Reuse platform Bicep modules that deny public endpoints in non-authoring environments",
                    "Apply Azure Policy deploy-if-not-exists for resilient private endpoints",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes =
                    "Recorded decision REMEDIATE — template backlog merges before evaluator refresh window completes.",
                ReviewedByUserId = "csp.platforms@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(12),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-kv-rotation",
                FindingType = "ComplianceReview",
                Category = "Secrets",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "Key Vault purge protection disabled on non-prod clones that hydrate demo datasets",
                Rationale =
                    "Rule sec-base-012 expects parity safeguards when clones mirror production classifications even for evaluator tenants.",
                PolicyRuleId = "sec-base-012",
                RecommendedActions =
                [
                    "Toggle purge-protection on vaulted clones referencing production-derived datasets",
                    "Automate KV drift scanners into weekly posture exports",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-sb-log-forwarding",
                FindingType = "OperationalReview",
                Category = "Observability",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Central SIEM forwarding delays occasionally exceed tightened tier-1 SLO drafts",
                Rationale =
                    "Rule sec-base-020 reinforces timely evidence streaming; seeded metrics narrate illustrative spikes under tour load envelopes.",
                PolicyRuleId = "sec-base-020",
                RecommendedActions =
                [
                    "Tune Event Hub TU ahead of scripted evaluator peaks",
                    "Publish workbook comparing SLA vs observed ingest latency",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision DEFER uplift for synthetic subscription — documented variance with stakeholders.",
                ReviewedByUserId = "sre.observability@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(18),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-ai-review-gate",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Human escalation matrix lacks after-hours reviewer for Tier-3 model releases",
                Rationale =
                    "Rule ai-gov-008 expects staffed dual-review coverage; seeded questionnaire cites single Friday engineer on-call roster.",
                PolicyRuleId = "ai-gov-008",
                RecommendedActions =
                [
                    "Mirror Entra privileged access groups for escalation coverage",
                    "Publish human-in-loop SLAs beside manifest DecisionTrace linkage",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["policyPackTheme"] = "ai-governance-responsible-ai-v1",
                    },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision REMEDIATE — playbook update scheduled ahead of externally hosted demos.",
                ReviewedByUserId = "trusted-ai.mesh@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(30),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"product-tour-{suffix}-ai-model-registry",
                FindingType = "ComplianceReview",
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Model registry skips adapter hashing for rapid playground refreshes",
                Rationale =
                    "Rule ai-gov-014 expects attributable adapter lineage — synthetic uploads intentionally omit LoRA payloads for readability.",
                PolicyRuleId = "ai-gov-014",
                RecommendedActions =
                [
                    "Store adapter checksum blobs alongside manifests",
                    "Produce weekly drift diff for promoted adapter weights",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["policyPackTheme"] = "ai-governance-responsible-ai-v1",
                    },
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
                "Synthetic inventory of Azure subscription 00000000-0000-0000-demo-000001 with App Service, APIM, Container Apps, Cosmos, Key Vault."),
            EvidenceDoc(seed, "contoso-cloud-context-diagram-v3.pdf", "Landing zone topology overlay for synthetic Contoso workloads."),
            EvidenceDoc(seed, "northwind-decision-record-dr0029.pdf", "Decision memo — segmented AI batch spoke egress patterns."),
            EvidenceDoc(seed, "security-questionnaire-responses-synthetic.xlsx", "Completed baseline questionnaire mapped to Pack B controls."),
            EvidenceDoc(seed, "responsible-ai-readiness-checklist.json", "Checklist excerpts aligned with Pack A (NIST AI RMF thematic mapping)."),
            EvidenceDoc(seed, "cost-footprint-estimate.md", "Illustrative FinOps appendix for evaluator-only SKU mix."),
            EvidenceDoc(seed, "operations-runbook-excerpt.txt", "Synthetic alerting narrative for inference tier regressions."),
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
                Label = "API Management façade",
                Category = "edge",
                SourceType = "product-tour-seed",
                SourceId = "evidence-azure-subscription-inventory.pdf",
            },
            new GraphNode
            {
                NodeId = "node-aca-batch",
                NodeType = "service",
                Label = "Container Apps AI batch plane",
                Category = "compute",
                SourceType = "product-tour-seed",
                SourceId = "evidence-contoso-diagram.pdf",
            },
            new GraphNode
            {
                NodeId = "node-openai",
                NodeType = "service",
                Label = "Azure OpenAI inference gateway",
                Category = "ai",
                SourceType = "product-tour-seed",
                SourceId = "evidence-responsible-ai-readiness-checklist.json",
            },
            new GraphNode
            {
                NodeId = "node-cosmos",
                NodeType = "datastore",
                Label = "Cosmos partitions (synthetic corpus)",
                Category = "data",
                SourceType = "product-tour-seed",
                SourceId = "evidence-training-corpus-ingest",
            },
            new GraphNode
            {
                NodeId = "node-kv",
                NodeType = "security",
                Label = "Key Vault — platform secrets bridge",
                Category = "secrets",
                SourceType = "product-tour-seed",
                SourceId = "evidence-kv-health-probe.json",
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
        IReadOnlyList<string> auditNotes =
        [
            "Decision ACCEPT_RISK (finding product-tour-ingress) subject to Defender alert choreography + CAB attestation uploads.",
            "Decision REMEDIATE (finding product-tour-privatelink / product-tour-ai-review-gate) — template + Trusted AI playbook owners assigned.",
            "Decision DEFER observability uplift (finding product-tour-log-forwarding) for synthetic evaluator subscription only.",
        ];

        GraphSnapshot graph = BuildGraphSnapshot(graphSnapshotId, contextSnapshotId, authorityRunGuid, snapshotUtc);

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
                ["firmLabel"] = "Northwind Architects (synthetic reviewer)",
                ["clientSystem"] = SystemName,
            },
        };
    }
}
