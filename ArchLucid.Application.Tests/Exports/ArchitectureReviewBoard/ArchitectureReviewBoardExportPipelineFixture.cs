using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     In-memory "finalized review" aggregate + analysis projection for export pipeline integration-style tests (no HTTP/SQL).
/// </summary>
internal static class ArchitectureReviewBoardExportPipelineFixture
{
    internal const string SyntheticRunId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

    internal static (ArchitectureRunDetail Detail, ArchitectureAnalysisReport Report) CreateSyntheticFinalizedReview()
    {
        GoldenManifest manifest = new()
        {
            RunId = SyntheticRunId,
            SystemName = "Synthetic Ledger",
            Services =
            [
                new ManifestService { ServiceName = "Ingest", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService, Purpose = "Intake" }
            ],
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "PrimaryDb",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                    PrivateEndpointRequired = true,
                    EncryptionAtRestRequired = true
                }
            ],
            Relationships = [],
            Governance = new ManifestGovernance
            {
                RiskClassification = "High",
                CostClassification = "Moderate",
                ComplianceTags = ["SOC2"],
                PolicyConstraints = ["Encrypt customer data at rest."],
                RequiredControls = ["MFA for operators."]
            },
            Metadata = new ManifestMetadata { ManifestVersion = "v99-pipeline", CreatedUtc = new DateTime(2026, 5, 16, 8, 0, 0, DateTimeKind.Utc) }
        };

        ArchitectureRun run = new()
        {
            RunId = SyntheticRunId,
            RequestId = "req-pipeline-77",
            Status = ArchitectureRunStatus.Committed,
            CurrentManifestVersion = "v99-pipeline",
            CreatedUtc = new DateTime(2026, 5, 15, 12, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 5, 16, 8, 5, 0, DateTimeKind.Utc),
            GoldenManifestId = Guid.Parse("f5555555-5555-5555-5555-555555555555")
        };

        RunEventTracePayload payload = new()
        {
            RunId = SyntheticRunId,
            EventType = "Synthetic.CommitGate",
            EventDescription = "Validated golden manifest prior to export fixture."
        };

        ArchitectureRunDetail detail = new()
        {
            Run = run,
            Manifest = manifest,
            HasBrokenManifestReference = false,
            DecisionTraces = [RunEventTrace.From(payload)],
            Results = [],
            Tasks = []
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = SyntheticRunId,
            RequestId = run.RequestId,
            SystemName = manifest.SystemName,
            Environment = "prod",
            CloudProvider = "Azure",
            Request = new RequestEvidence
            {
                Description = "Synthetic pipeline evidence narrative.",
                Constraints = ["Regional residency"],
                RequiredCapabilities = ["Idempotency"]
            }
        };

        ArchitectureAnalysisReport report = new()
        {
            Run = run,
            Manifest = manifest,
            Evidence = evidence,
            Summary = "Synthetic executive summary produced by pipeline fixture.",
            Warnings = ["Synthetic model-assisted warning pending disposition."]
        };

        return (detail, report);
    }
}
