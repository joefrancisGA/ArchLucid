using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Tests.Exports;

/// <summary>Seeded Claims Intake demo inputs for executive review packet golden tests.</summary>
internal static class ExecutiveReviewPacketDemoFixture
{
    internal const string DemoRunId = "claims-intake-modernization";

    internal static readonly DateTime StableGeneratedUtc = new(2026, 5, 16, 14, 0, 0, DateTimeKind.Utc);

    internal sealed class DemoPacketInputs
    {
        internal ArchitectureRunDetail Detail { get; init; } = null!;

        internal string ExecutiveSummary { get; init; } = string.Empty;

        internal IReadOnlyList<string> TopFindingTitles { get; init; } = [];

        internal ExecutiveRoiSummaryResponse RoiSummary { get; init; } = null!;

        internal IReadOnlyList<ExecutiveReviewPacketDecisionRow> TopDecisions { get; init; } = [];

        internal ExecutiveReviewPacketPortfolioSignals PortfolioSignals { get; init; } = null!;
    }

    internal static DemoPacketInputs CreateSeededDemoRun()
    {
        GoldenManifest manifest = new()
        {
            RunId = DemoRunId,
            SystemName = "Claims Intake Modernization",
            Services =
            [
                new ManifestService
                {
                    ServiceName = "IntakeApi",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                    Purpose = "Claims intake HTTP boundary"
                }
            ],
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "ClaimsDb",
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
                ComplianceTags = ["HIPAA", "healthcare-claims-v3"],
                PolicyConstraints = ["PHI minimization at intake boundary."],
                RequiredControls = ["Ingress PHI classification control."]
            },
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "claims-intake-v3-demo",
                CreatedUtc = new DateTime(2026, 5, 16, 8, 0, 0, DateTimeKind.Utc)
            }
        };

        ArchitectureRun run = new()
        {
            RunId = DemoRunId,
            RequestId = "req-claims-intake-demo",
            Status = ArchitectureRunStatus.Committed,
            CurrentManifestVersion = "claims-intake-v3-demo",
            CreatedUtc = new DateTime(2026, 5, 15, 12, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 5, 16, 8, 5, 0, DateTimeKind.Utc),
            GoldenManifestId = Guid.Parse("a1c2e3f4-a5b6-7890-abcd-ef1234567890")
        };

        ArchitectureRunDetail detail = new()
        {
            Run = run,
            Manifest = manifest,
            HasBrokenManifestReference = false,
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Critical,
                            Message = "PHI minimization risk at intake boundary",
                            Category = "Compliance"
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Error,
                            Message = "Under-provisioned OCR worker autoscale floor",
                            Category = "Cost"
                        },
                        new ArchitectureFinding
                        {
                            Severity = FindingSeverity.Warning,
                            Message = "Missing regional failover documentation",
                            Category = "Reliability"
                        }
                    ]
                }
            ],
            Tasks = []
        };

        ExecutiveRoiSummaryResponse roiSummary = new()
        {
            TotalEstimatedUsdSavings = 8400m,
            SystemCount = 1,
            LatestRunCount = 1,
            EaDiscountMultiplier = 0.85m,
            SavingsPricingBasis = ExecutiveRoiSavingsPricingBasis.EaAdjusted,
            SavingsPricingBasisDescription =
                "Cost-category findings use EA-adjusted Azure Retail rates for the demo tenant.",
            CostEvidenceFreshnessStatus = RoiCostEvidenceFreshness.Fresh,
            CostEvidenceStaleAfterDays = 90,
            ResolvedFindingsCount30Days = 2,
            NewlyDiscoveredFindingsCount30Days = 3,
            TopSystemicIssues =
            [
                new SystemicIssueSummary { Category = "Compliance", Severity = "Critical", Count = 1 }
            ],
            Systems =
            [
                new SystemLatestRunRoi
                {
                    SystemName = "Claims Intake Modernization",
                    RunId = DemoRunId,
                    CommittedUtc = new DateTime(2026, 5, 16, 8, 5, 0, DateTimeKind.Utc),
                    EstimatedUsdSavings = 8400m
                }
            ],
            RealizedValue = new RealizedValueSummary
            {
                FindingsRemediatedCount30Days = 1,
                MedianTimeToRemediationDays = 4.5,
                ActiveWaiversCount = 0,
                WaiversRetiredCount30Days = 0,
                WaiverExpiryReversionCount30Days = 0,
            },
            BasisBreakdown = new ExecutiveRoiBasisBreakdown
            {
                OpenEstimatedUsd = 6200m,
                AcceptedRiskUsd = 1200m,
                NeedsEvidenceUsd = 1000m,
                DeferredUsd = 0m,
                WaivedUsd = 0m,
                RealizedUsd = 0m,
                RejectedNotApplicableUsd = 0m,
                TotalPotentialUsd = 8400m,
            },
        };

        return new DemoPacketInputs
        {
            Detail = detail,
            ExecutiveSummary =
                "Proceed with claims intake modernization under monitored PHI minimization controls — sponsor-facing KPIs remain on track.",
            TopFindingTitles =
            [
                "PHI minimization risk at intake boundary",
                "Under-provisioned OCR worker autoscale floor",
                "Missing regional failover documentation"
            ],
            RoiSummary = roiSummary,
            TopDecisions =
            [
                new ExecutiveReviewPacketDecisionRow
                {
                    Title = "PHI ingress classification",
                    SelectedOption = "Enforce boundary classifier before persistence",
                    ConfidenceLabel = "Rule audit (0.92)",
                    EvidenceHref = "/governance/decision-register"
                }
            ],
            PortfolioSignals = new ExecutiveReviewPacketPortfolioSignals
            {
                ResolvedFindingsCount30Days = 2,
                NewlyDiscoveredFindingsCount30Days = 3,
                StaleRiskCount = 1,
                ExpiringWaiversCount14Days = 0,
                NextActions =
                [
                    "Review stale PHI minimization risk in the architecture risk register.",
                    "Confirm EA-adjusted savings assumptions with FinOps before sponsor sign-off."
                ]
            }
        };
    }

    internal static string LoadGoldenMarkdown()
    {
        string path = Path.Combine(
            AppContext.BaseDirectory,
            "Exports",
            "Golden",
            "executive-review-packet-demo-run.md");

        if (!File.Exists(path))
        {
            throw new FileNotFoundException(
                $"Golden executive review packet not found at '{path}'. Ensure CopyToOutputDirectory is set.");
        }

        return File.ReadAllText(path);
    }
}
