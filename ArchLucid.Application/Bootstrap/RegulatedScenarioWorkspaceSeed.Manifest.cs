using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Bootstrap;

internal static partial class RegulatedScenarioWorkspaceSeed
{
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
        const string lakeCurated = "ds-adl-gen2-curated-features";
        const string lakeRaw = "ds-adl-raw-ingest-synth";
        const string modelReg = "ds-aml-model-registry";

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
}
