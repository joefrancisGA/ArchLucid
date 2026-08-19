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

/// <summary>
/// Synthetic <strong>created</strong> architecture package — goals/constraints guided intake for an enterprise internal
/// copilot RAG platform with born-governed findings, manifest, and export affordances.
/// </summary>
internal static class CreatedSampleWorkspaceSeed
{
    internal const string ManifestVersion = "northwind-copilot-rag-created-v1-manifest";

    private const string SystemName = "Enterprise.Copilot.RagPlatform";

    private static readonly DateTime SeedUtc = new(2026, 4, 2, 10, 30, 0, DateTimeKind.Utc);

    internal static DateTime SnapshotUtc => SeedUtc;

    internal static string ManifestVersionLiteral => ManifestVersion;

    internal static GoldenManifest BuildManifest(string legacyRunIdN)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags = ["AI-Governance-Pack-A", "Security-Baseline-Pack-B", "Responsible-AI-synthetic"],
            PolicyConstraints =
            [
                "All inference and search data planes use private connectivity from the application VNet",
                "System prompts and tool manifests change only through approved pipeline",
                "PII and secrets must not appear in vector index — ingestion enforces redaction patterns (design intent)",
            ],
            RequiredControls = ["PrivateEndpoints", "KeyVaultIntegratedSecrets", "ContentSafety", "AzureMonitor"],
            RiskClassification = "Moderate",
            CostClassification = "Moderate",
        };

        const string svcApim = "svc-northwind-copilot-apim";
        const string svcOrchestrator = "svc-northwind-chat-orchestrator";
        const string svcSearch = "svc-northwind-ai-search";
        const string svcAoai = "svc-northwind-azure-openai";
        const string searchIndex = "ds-northwind-vector-index";
        const string kvSecrets = "ds-northwind-kv-secrets";

        List<ManifestService> services =
        [
            new()
            {
                ServiceId = svcApim,
                ServiceName = "API Management gateway",
                ServiceType = ServiceType.Integration,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "External REST façade for copilot clients with content-safety and rate policies.",
                Tags = ["edge", "gateway"],
                RequiredControls = ["ManagedTls", "WafBaseline"],
            },
            new()
            {
                ServiceId = svcOrchestrator,
                ServiceName = "Chat orchestration worker",
                ServiceType = ServiceType.Worker,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "RAG retrieval, tool routing, and audit logging for workforce copilot sessions.",
                Tags = ["orchestration"],
                RequiredControls = ["ManagedIdentity"],
            },
            new()
            {
                ServiceId = svcSearch,
                ServiceName = "Azure AI Search retrieval",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Hybrid vector + semantic retrieval over redacted corporate document corpus.",
                Tags = ["rag"],
                RequiredControls = ["PrivateLink"],
            },
            new()
            {
                ServiceId = svcAoai,
                ServiceName = "Azure OpenAI completions",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.AzureOpenAi,
                Purpose = "Policy-gated chat completion and embedding endpoints.",
                Tags = ["ai-plane"],
                RequiredControls = ["PrivateLink", "ContentSafety"],
            },
        ];

        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = searchIndex,
                DatastoreName = "Corporate docs vector index",
                DatastoreType = DatastoreType.Search,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Synthetic document embeddings with classification tags — no customer PHI.",
            },
            new()
            {
                DatastoreId = kvSecrets,
                DatastoreName = "Key Vault — platform secrets",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.KeyVault,
                Purpose = "Secrets bridge for search keys and Foundry-managed credentials.",
            },
        ];

        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{svcApim}-calls-{svcOrchestrator}",
                SourceId = svcApim,
                TargetId = svcOrchestrator,
                RelationshipType = RelationshipType.Calls,
                Description = "Copilot clients invoke orchestration through APIM policies.",
            },
            new()
            {
                RelationshipId = $"rel-{svcOrchestrator}-reads-{svcSearch}",
                SourceId = svcOrchestrator,
                TargetId = svcSearch,
                RelationshipType = RelationshipType.ReadsFrom,
                Description = "Orchestrator retrieves grounded chunks before completion.",
            },
            new()
            {
                RelationshipId = $"rel-{svcOrchestrator}-calls-{svcAoai}",
                SourceId = svcOrchestrator,
                TargetId = svcAoai,
                RelationshipType = RelationshipType.Calls,
                Description = "Completions routed through private egress to Azure OpenAI.",
            },
            new()
            {
                RelationshipId = $"rel-{svcSearch}-writes-{searchIndex}",
                SourceId = svcSearch,
                TargetId = searchIndex,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Embedding pipeline refreshes vector index partitions.",
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
                ChangeDescription =
                    "Synthetic Enterprise Copilot RAG platform — born-governed created architecture package from guided intake.",
                DecisionTraceIds = [],
                CreatedUtc = SeedUtc,
            },
        };
    }

    internal static IReadOnlyList<Finding> BuildFindings(Guid authorityRunGuid)
    {
        string suffix = authorityRunGuid.ToString("N")[..12];

        return
        [
            new()
            {
                FindingId = $"created-{suffix}-private-inference-egress",
                FindingType = "SecurityReview",
                Category = "Network",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Inference path may traverse public egress before private link cutover completes",
                Rationale =
                    "Draft intake targets private Azure OpenAI and AI Search endpoints; interim dev subscriptions still allow managed public endpoints for playground refreshes.",
                PolicyRuleId = "sec-base-private-link-01",
                RecommendedActions =
                [
                    "Deny public network access on Azure OpenAI and AI Search resources",
                    "Validate private DNS zones resolve from orchestration spoke before production promotion",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-llm-workload" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"created-{suffix}-content-safety-gap",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Content safety filters not yet wired on APIM outbound policy chain",
                Rationale =
                    "Guided intake promises gateway-level abuse monitoring; policy templates still reference placeholder content-filter deployment slots.",
                PolicyRuleId = "ai-gov-content-safety-03",
                RecommendedActions =
                [
                    "Attach Azure AI Content Safety endpoint to APIM policy before workforce pilot",
                    "Document kill-switch tested each release train",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision REMEDIATE — safety hooks scheduled ahead of internal pilot cohort.",
                ReviewedByUserId = "trusted-ai.mesh@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"created-{suffix}-prompt-manifest-drift",
                FindingType = "OperationalReview",
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "System prompt manifest lacks checksum attestation on rapid playground updates",
                Rationale =
                    "Creation workflow asserts prompt changes flow through approved pipeline; playground shortcuts bypass adapter hashing.",
                PolicyRuleId = "ai-gov-prompt-lineage-07",
                RecommendedActions =
                [
                    "Store prompt manifest checksum blobs alongside deployments",
                    "Publish weekly drift diff for promoted system prompts",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"created-{suffix}-index-redaction-coverage",
                FindingType = "ComplianceReview",
                Category = "DataHandling",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Vector index redaction patterns cover common PII formats but not custom employee IDs",
                Rationale =
                    "Ingestion pipeline design intent includes regex redaction; synthetic corpus omits bespoke HR identifier formats for readability.",
                PolicyRuleId = "sec-base-data-min-04",
                RecommendedActions =
                [
                    "Extend redaction rule pack with workforce identifier patterns",
                    "Sample index partitions weekly for residual secret leakage",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Recorded decision ACCEPT_RISK for synthetic evaluator tenant — production would require HR pattern pack.",
                ReviewedByUserId = "privacy.ops@northwind-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(10),
                RunIdRef = suffix,
            },
        ];
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
                Label = "API Management gateway",
                Category = "edge",
                SourceType = "created-sample-seed",
                SourceId = "evidence-copilot-architecture-brief.md",
            },
            new GraphNode
            {
                NodeId = "node-orchestrator",
                NodeType = "service",
                Label = "Chat orchestration worker",
                Category = "compute",
                SourceType = "created-sample-seed",
                SourceId = "evidence-orchestration-runbook.md",
            },
            new GraphNode
            {
                NodeId = "node-search",
                NodeType = "service",
                Label = "Azure AI Search retrieval",
                Category = "ai",
                SourceType = "created-sample-seed",
                SourceId = "evidence-search-index-profile.json",
            },
            new GraphNode
            {
                NodeId = "node-openai",
                NodeType = "service",
                Label = "Azure OpenAI completions",
                Category = "ai",
                SourceType = "created-sample-seed",
                SourceId = "evidence-openai-private-endpoint-diagram.pdf",
            },
        ]);

        graph.Edges.AddRange(
        [
            new GraphEdge { EdgeId = "edge-apim-orchestrator", FromNodeId = "node-apim", ToNodeId = "node-orchestrator", EdgeType = "routesTo", Weight = 1 },
            new GraphEdge { EdgeId = "edge-orchestrator-search", FromNodeId = "node-orchestrator", ToNodeId = "node-search", EdgeType = "readsFrom", Weight = 1 },
            new GraphEdge { EdgeId = "edge-orchestrator-openai", FromNodeId = "node-orchestrator", ToNodeId = "node-openai", EdgeType = "calls", Weight = 1 },
        ]);

        return graph;
    }

    internal static AuthorityCommittedChainSeedCustomization BuildCustomization(
        Guid authorityRunGuid,
        Guid graphSnapshotId,
        Guid contextSnapshotId,
        DateTime snapshotUtc)
    {
        IReadOnlyList<string> auditNotes =
        [
            "Decision REMEDIATE (finding private-inference-egress) — private link cutover tracked on platform backlog.",
            "Decision REMEDIATE (finding content-safety-gap) — APIM policy attachment before workforce pilot.",
            "Decision ACCEPT_RISK (finding index-redaction-coverage) for synthetic evaluator corpus only.",
        ];

        GraphSnapshot graph = BuildGraphSnapshot(graphSnapshotId, contextSnapshotId, authorityRunGuid, snapshotUtc);

        return new AuthorityCommittedChainSeedCustomization
        {
            AdditionalCanonicalObjects = BuildSyntheticEvidenceObjects(authorityRunGuid),
            AdditionalRuleAuditNotes = auditNotes,
            GraphSnapshotOverride = graph,
        };
    }

    private static IReadOnlyList<CanonicalObject> BuildSyntheticEvidenceObjects(Guid authorityRunGuid)
    {
        string seed = authorityRunGuid.ToString("N");

        return
        [
            EvidenceDoc(seed, "copilot-architecture-brief.md", "Guided-intake goals and constraints for enterprise internal copilot."),
            EvidenceDoc(seed, "rag-retrieval-design-notes.md", "Hybrid retrieval and grounding posture for corporate document corpus."),
            EvidenceDoc(seed, "content-safety-checklist.json", "Responsible AI hooks and human-in-loop escalation matrix (synthetic)."),
            EvidenceDoc(seed, "private-endpoint-diagram.pdf", "Hub-spoke layout with private Azure OpenAI and AI Search endpoints."),
        ];
    }

    private static CanonicalObject EvidenceDoc(string seed, string filename, string summary)
    {
        return new CanonicalObject
        {
            ObjectType = "evidence_attachment",
            Name = filename,
            SourceType = "created-sample-seed",
            SourceId = seed,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["format"] = Path.GetExtension(filename).TrimStart('.').ToLowerInvariant(),
                ["summary"] = summary,
                ["firmLabel"] = "Enterprise sample (synthetic)",
                ["clientSystem"] = SystemName,
            },
        };
    }
}
