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

/// <summary>Workspace B payloads: synthetic healthtech AI governance + regulated security findings (no PHI).</summary>
internal static class RegulatedScenarioWorkspaceSeed
{
    internal const string WhitelabelFirmDisplayName = "Meridian Advisory Group";

    internal const string WhitelabelClientEngagementTitle = "Alpine Health — AI Governance Engagement";

    internal const string WhitelabelLogoBlobReference = "demo-tenant/brand/meridian-advisory-placeholder-logo.svg";

    internal const string ManifestVersion = "meridian-alpine-regulated-demo-v1-manifest";

    private const string SystemName = "Alpine Patient Risk Scoring Platform";

    private static readonly DateTime SeedUtc = new(2026, 3, 18, 14, 45, 0, DateTimeKind.Utc);

    internal static DateTime SnapshotUtc => SeedUtc;

    internal static string ManifestVersionLiteral => ManifestVersion;

    internal static GoldenManifest BuildManifest(string legacyRunIdN)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags =
            [
                "HIPAA-aligned-synthetic",
                "AI-Governance-Pack-A",
                "Security-Baseline-Pack-B",
                "PHI-prohibited-evaluator-tenant",
            ],
            PolicyConstraints =
            [
                "All patient-linked attributes in this fixture are synthetic categorical labels only — no real PHI",
                "Inference endpoints must enforce ABAC + entitlement reviews before production traffic",
                "Training lake partitions carry synthetic classification tags {restricted, internal-ml, public-synth}",
            ],
            RequiredControls = ["PrivateEndpoints", "AzureMonitor", "PurviewClassification", "ResponsibleAIReview", "KeyVaultIntegratedSecrets"],
            RiskClassification = "High",
            CostClassification = "Moderate",
        };

        const string svcInfer = "svc-alpine-inference-endpoint";
        const string svcTraining = "svc-alpine-aml-training";
        const string svcFeature = "svc-alpine-feature-store";
        string lakeCurated = "ds-adl-gen2-curated-features";
        string lakeRaw = "ds-adl-raw-ingest-synth";
        string modelReg = "ds-aml-model-registry";

        List<ManifestService> services =
        [
            new()
            {
                ServiceId = svcInfer,
                ServiceName = "Clinical Scoring Inference Plane",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Synthetic batch + near-real-time scoring API (demo labels only; PHI-free).",
                Tags = ["phi-prohibited-fixture", "infer"],
                RequiredControls = ["PrivateLink", "AzureMonitor", "ContentSafety"],
            },
            new()
            {
                ServiceId = svcTraining,
                ServiceName = "Azure ML Training Orchestrator",
                ServiceType = ServiceType.Worker,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Pipeline references for training jobs, drift monitors, and Responsible AI sign-off hooks.",
                Tags = ["training", "aml"],
                RequiredControls = ["ManagedIdentity", "KeyVaultIntegratedSecrets"],
            },
            new()
            {
                ServiceId = svcFeature,
                ServiceName = "Feature Store — synthetic cohort windows",
                ServiceType = ServiceType.DataService,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Versioned feature lineage for model cards (synthetic schema).",
                Tags = ["features", "governance"],
                RequiredControls = ["PrivateEndpoints"],
            },
        ];

        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = lakeRaw,
                DatastoreName = "ADLS Gen2 — Raw synthetic cohort lake",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Staging zone with classification tags (internal-ml / synthetic).",
            },
            new()
            {
                DatastoreId = lakeCurated,
                DatastoreName = "ADLS Gen2 — Curated modeling lake",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Partitioned parquet for training with Purview labels (demo tenant).",
            },
            new()
            {
                DatastoreId = modelReg,
                DatastoreName = "AML Model Registry snapshot",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Registered models + adapters for patient risk ensemble (synthetic versioning narrative).",
            },
        ];

        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{svcTraining}-writes-{lakeCurated}",
                SourceId = svcTraining,
                TargetId = lakeCurated,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Training jobs persist curated folds with synthetic labels.",
            },
            new()
            {
                RelationshipId = $"rel-{svcInfer}-reads-{lakeCurated}",
                SourceId = svcInfer,
                TargetId = lakeCurated,
                RelationshipType = RelationshipType.ReadsFrom,
                Description = "Inference pulls entitlement-scoped feature slices.",
            },
            new()
            {
                RelationshipId = $"rel-{svcInfer}-calls-{svcFeature}",
                SourceId = svcInfer,
                TargetId = svcFeature,
                RelationshipType = RelationshipType.Calls,
                Description = "Runtime hydration through feature retrieval policies.",
            },
            new()
            {
                RelationshipId = $"rel-{svcTraining}-writes-{modelReg}",
                SourceId = svcTraining,
                TargetId = modelReg,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Promoted models logged with Responsible AI attestations.",
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
                ChangeDescription = "Synthetic Alpine Health Innovations modernization — Meridian Advisory Group engagement shell.",
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
                FindingId = $"regulated-demo-{suffix}-sb-public-infer",
                FindingType = "ComplianceReview",
                Category = "SecurityArchitectureBaseline",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Error,
                Title = "Inference gateway still advertises interim public listener for partner smoke tests",
                Rationale =
                    "Rule sec-base-006 flags workloads that still rely on implicit public access where segmented landing zones expect Private Link or firewall constraints; "
                    + "the interim dual-homed inference listener mirrors that gap for evaluator demos.",
                PolicyRuleId = "sec-base-006",
                RecommendedActions =
                [
                    "Remove public ingress on production profiles; route partners through private APIM + Microsoft Entra claims",
                    "Attach conditional access context to scoring APIs",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision REMEDIATE — Meridian backlog item ALP-441 severs public listener before external pilot.",
                ReviewedByUserId = "security.architecture@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(4),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-model-versioning",
                FindingType = "ComplianceReview",
                Category = "ModelGovernance",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Error,
                Title = "Promoted scoring ensemble lacks immutable lineage hash between registry and deployment slot",
                Rationale =
                    "Rule ai-gov-002 expects checksum parity across registry, packaging, and inference slots; fixture narrates a gap during blue/green swap.",
                PolicyRuleId = "ai-gov-002",
                RecommendedActions =
                [
                    "Emit digest attestation in manifest DecisionTrace before promotion",
                    "Fail pipeline when registry artifact hash != deployed image signature",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision REMEDIATE — ML platform owners scheduled within synthetic sprint window.",
                ReviewedByUserId = "trusted-ai.lead@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(6),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-drift",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Drift monitors defined but not wired to executive escalation for weekend scoring releases",
                Rationale = "Rule ai-gov-011 expects automated drift routing; synthetic config references dormant action groups.",
                PolicyRuleId = "ai-gov-011",
                RecommendedActions =
                [
                    "Bind Azure Monitor alert rules to incident bridge + on-call roster",
                    "Add manifest-controlled drift thresholds per cohort slice",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-human-gate",
                FindingType = "ComplianceReview",
                Category = "ResponsibleAi",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Tier-3 model promotion lacks dual human attestation artifacts in seeded workflow",
                Rationale = "Rule ai-gov-008 expects staffed escalation matrix with signed attestations archived to evidence.",
                PolicyRuleId = "ai-gov-008",
                RecommendedActions =
                [
                    "Attach attestation bundle IDs on each promotion PR",
                    "Mirror Entra PIM elevations with reviewer parity",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision ACCEPT_RISK contingent on interim CAB minutes stored in Meridian vault replica.",
                ReviewedByUserId = "clinical.safety.liaison@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(18),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-vendor-model",
                FindingType = "ComplianceReview",
                Category = "ThirdPartyRisk",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Warning,
                Title = "Vendor foundation model DPIA appendix incomplete for alpine-specific jurisdictions",
                Rationale =
                    "Rule ai-gov-026 flags missing jurisdiction addenda when third-party base models underpin regulated scoring tiers.",
                PolicyRuleId = "ai-gov-026",
                RecommendedActions =
                [
                    "Upload vendor attestation pack with data residency matrix",
                    "Record compensating controls in DecisionTrace",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-sb-encryption",
                FindingType = "ComplianceReview",
                Category = "DataProtection",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Warning,
                Title = "Training lake encryption-at-rest parity lagged on archival tier for synthetic PHI-like tags",
                Rationale =
                    "Rule sec-base-011 expects EncryptionAtRestRequired and CMK posture consistency when labels imply restricted payloads — demo narrates remediation backlog.",
                PolicyRuleId = "sec-base-011",
                RecommendedActions =
                [
                    "Attach customer-managed keys to archival storage accounts",
                    "Automate defender scan for permissive SAS tokens",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision WAIVE_CONDITIONAL pending FinOps-approved CMK budget line (synthetic SKU).",
                ReviewedByUserId = "data.protection@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(22),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-doc-drift",
                FindingType = "OperationalReview",
                Category = "Documentation",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Model card narrative omits adapter provenance for rapid playground refreshes",
                Rationale =
                    "Rule ai-gov-014 expects adapter checksum references; synthetic fast refresh path skipped heavy attachments for readability.",
                PolicyRuleId = "ai-gov-014",
                RecommendedActions =
                [
                    "Attach adapter digest SHA256 to registry metadata",
                    "Publish weekly diff for promoted adapters",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-ai-monitoring-config",
                FindingType = "OperationalReview",
                Category = "Observability",
                EngineType = "AiGovernanceSeed",
                Severity = FindingSeverity.Info,
                Title = "Monitoring workbook references placeholder subscription IDs for drift burn-down charts",
                Rationale = "Rule ai-gov-033 encourages alignment between monitoring assets and manifest references.",
                PolicyRuleId = "ai-gov-033",
                RecommendedActions =
                [
                    "Bind workbooks to canonical landing zone resource IDs",
                    "Tag dashboards with engagement code ALPINE-MER-01",
                ],
                Properties =
                    new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "ai-governance-responsible-ai-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision DEFER uplift until external evaluator tour refresh.",
                ReviewedByUserId = "sre.observability@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(28),
                RunIdRef = suffix,
            },
            new()
            {
                FindingId = $"regulated-demo-{suffix}-sb-audit-trail",
                FindingType = "OperationalReview",
                Category = "Audit",
                EngineType = "SecurityBaselineSeed",
                Severity = FindingSeverity.Info,
                Title = "Immutable audit feed sampling interval widened during synthetic load tests",
                Rationale =
                    "Rule sec-base-018 expects subscription-level change auditing assumptions to stay timely for proof packs; fixture documents variance acceptable for sandbox hours only.",
                PolicyRuleId = "sec-base-018",
                RecommendedActions =
                [
                    "Tighten Event Hub capture interval post-demo",
                    "Mirror SIEM routing latency SLO in governance dashboard",
                ],
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["policyPackTheme"] = "security-baseline-v1" },
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ReviewNotes = "Decision DEFER — synthetic subscription only; production parity tracked separately.",
                ReviewedByUserId = "grc.audit@meridian-demo.example",
                ReviewedAtUtc = SeedUtc.AddHours(30),
                RunIdRef = suffix,
            },
        };
    }

    internal static IReadOnlyList<CanonicalObject> BuildSyntheticEvidenceObjects(Guid authorityRunGuid)
    {
        string seed = authorityRunGuid.ToString("N");

        return new List<CanonicalObject>
        {
            EvidenceDoc(seed, "alpine-model-registry-export.csv", "Synthetic AML model registry extract (ids redacted)."),
            EvidenceDoc(seed, "alpine-data-classification-matrix.xlsx", "Column-level labels {synthetic-restricted, internal-ml, public-synth}."),
            EvidenceDoc(seed, "meridian-human-review-process.pdf", "Human-in-the-loop gates for Tier-3 promotions (fabricated)."),
            EvidenceDoc(seed, "deployment-approval-workflow-screenshot.png", "Placeholder Change Advisory narrative for demo UI."),
            EvidenceDoc(seed, "vendor-risk-assessment-third-party-model.pdf", "Third-party foundation model questionnaire (synthetic)."),
            EvidenceDoc(seed, "monitoring-drift-config.yaml", "Azure Monitor + AML drift monitors (evaluator-safe)."),
            EvidenceDoc(seed, "training-pipeline-overview.md", "Batch + streaming training references without PHI samples."),
            EvidenceDoc(seed, "synthetic-fhir-schema-mapping.json", "Illustrative mapping doc — no real patient records."),
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
                NodeId = "node-infer",
                NodeType = "ai_service",
                Label = "Scoring inference API",
                Category = "ai",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-monitoring-drift-config.yaml",
            },
            new GraphNode
            {
                NodeId = "node-train",
                NodeType = "ml_pipeline",
                Label = "AML training orchestration",
                Category = "training",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-training-pipeline-overview.md",
            },
            new GraphNode
            {
                NodeId = "node-lake",
                NodeType = "data_lake",
                Label = "Curated modeling lake",
                Category = "data",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-alpine-data-classification-matrix.xlsx",
            },
            new GraphNode
            {
                NodeId = "node-registry",
                NodeType = "model_registry",
                Label = "Model registry",
                Category = "governance",
                SourceType = "regulated-demo-seed",
                SourceId = "evidence-alpine-model-registry-export.csv",
            },
        ]);

        graph.Edges.AddRange(
        [
            new GraphEdge
            {
                EdgeId = "edge-train-lake",
                FromNodeId = "node-train",
                ToNodeId = "node-lake",
                EdgeType = "materializes",
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "edge-infer-lake",
                FromNodeId = "node-infer",
                ToNodeId = "node-lake",
                EdgeType = "readsFrom",
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "edge-train-registry",
                FromNodeId = "node-train",
                ToNodeId = "node-registry",
                EdgeType = "registers",
                Weight = 1,
            },
            new GraphEdge
            {
                EdgeId = "edge-infer-registry",
                FromNodeId = "node-infer",
                ToNodeId = "node-registry",
                EdgeType = "binds",
                Weight = 1,
            },
        ]);

        return graph;
    }

    internal static AuthorityCommittedChainSeedCustomization BuildCustomization(Guid authorityRunGuid, Guid graphSnapshotId, Guid contextSnapshotId,
        DateTime snapshotUtc)
    {
        IReadOnlyList<string> auditNotes =
        [
            "Decision REMEDIATE (public inference listener) — Meridian security pod tracks ALP-441 to private APIM only.",
            "Decision REMEDIATE (model lineage hash gap) — ML platform enables digest attestation prior to next synthetic promotion window.",
            "Decision ACCEPT_RISK (human gate attestation) with CAB minutes + temporary dual-review waiver (evaluator tenant).",
            "Decision WAIVE_CONDITIONAL (CMK parity) pending FinOps budget micro-approval for synthetic subscription.",
            "Decision DEFER (observability workbook binding) after tour refresh so marketing screenshots stay stable.",
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
            SourceType = "regulated-demo-seed",
            SourceId = seed,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["format"] = Path.GetExtension(filename).TrimStart('.').ToLowerInvariant(),
                ["summary"] = summary,
                ["firmLabel"] = $"{WhitelabelFirmDisplayName} (whitelabel demo)",
                ["clientSystem"] = SystemName,
            },
        };
    }
}
