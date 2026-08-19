using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Deep architecture cases for the TB-1990 benchmark pyramid (beyond the golden incomplete case).</summary>
public static class ArchitectureIntelligenceDeepCaseCatalog
{
    public static IReadOnlyList<ArchitectureIntelligenceDeepCase> GetAdditionalDeepCases()
    {
        return
        [
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-multi-region-dr",
                Title = "Multi-region DR with incomplete failover evidence",
                SourceText = """
                    Public SaaS platform serving EU and US tenants.
                    Primary region: East US. Secondary region mentioned but no failover runbook.
                    RTO claimed: 15 minutes. No cross-region replication evidence.
                    Customer PII stored. Authentication via API keys only.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "missing-failover",
                        TitlePattern = "recovery",
                        Dimension = QualityDimension.Reliability,
                        MinSeverity = "Medium",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "weak-auth",
                        TitlePattern = "auth",
                        Dimension = QualityDimension.Security,
                        MinSeverity = "High",
                    },
                ],
                ExpectedMutationIds = ["mutate-rto-30m", "mutate-add-replication"],
            },
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-pii-without-encryption",
                Title = "Regulated PII without encryption or trust boundary",
                SourceText = """
                    Internal claims processing app stores SSN and health data.
                    Database is single-tenant SQL with backups. No encryption-at-rest described.
                    Public admin portal exists. No trust boundary documented.
                    Compliance claim: "requires GDPR Article 32" without external citation label.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "pii-trust-boundary",
                        TitlePattern = "trust boundary",
                        Dimension = QualityDimension.Security,
                        MinSeverity = "High",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "public-admin",
                        TitlePattern = "public",
                        Dimension = QualityDimension.Security,
                        MinSeverity = "High",
                    },
                ],
                ExpectedMutationIds = ["mutate-data-regulated", "mutate-remove-trust-boundary"],
            },
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-cost-spike-no-budget",
                Title = "Cost-sensitive workload without ownership or budget controls",
                SourceText = """
                    Batch analytics pipeline on Azure Databricks mentioned without assumption labels.
                    Unowned nightly jobs write to a shared storage account.
                    No cost driver or budget ceiling documented.
                    Reliability is secondary; cost is the declared priority.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "missing-cost-driver",
                        TitlePattern = "cost",
                        Dimension = QualityDimension.Cost,
                        MinSeverity = "Medium",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "unowned-jobs",
                        TitlePattern = "owner",
                        Dimension = QualityDimension.Cost,
                        MinSeverity = "Medium",
                    },
                ],
                ExpectedMutationIds = ["mutate-data-regulated"],
            },
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-orphaned-identity-trust-boundary",
                Title = "Orphaned identity boundary with conflicting goals",
                SourceText = """
                    Greenfield identity broker. Stakeholders disagree: security wants private endpoints;
                    product wants a public signup API.
                    Current draft exposes a public HTTPS API without authentication.
                    No trust boundary, no operational owner for the identity service.
                    Target-state mentions private link; current-state ignores it.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "public-signup",
                        TitlePattern = "public",
                        Dimension = QualityDimension.Security,
                        MinSeverity = "High",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "missing-trust-boundary",
                        TitlePattern = "trust boundary",
                        Dimension = QualityDimension.Security,
                        MinSeverity = "High",
                    },
                ],
                ExpectedMutationIds = ["mutate-remove-trust-boundary"],
            },
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-regulated-workload-residency",
                Title = "Regulated workload with residency gap",
                SourceText = """
                    Healthcare analytics platform processing PHI for US patients.
                    Data residency requirement: US-only. Architecture mentions EU backup region.
                    Third-party OCR vendor API used without interface documentation.
                    50,000 concurrent users expected at peak with no capacity plan.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "residency-conflict",
                        TitlePattern = "compliance",
                        Dimension = QualityDimension.PrivacyCompliance,
                        MinSeverity = "Medium",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "vendor-api",
                        TitlePattern = "external",
                        Dimension = QualityDimension.Integration,
                        MinSeverity = "Medium",
                    },
                ],
                ExpectedMutationIds = ["mutate-data-regulated"],
            },
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-ambiguous-stakeholder-goals",
                Title = "Ambiguous stakeholder goals and unstated load",
                SourceText = """
                    Stakeholders disagree on whether the MVP must support real-time sync.
                    Product wants 10,000 users; operations wants minimal on-call burden.
                    No capacity expectation documented. No operational owner named.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "capacity-gap",
                        TitlePattern = "capacity",
                        Dimension = QualityDimension.PerformanceScalability,
                        MinSeverity = "Medium",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "operations-gap",
                        TitlePattern = "ownership",
                        Dimension = QualityDimension.Operations,
                        MinSeverity = "Medium",
                    },
                ],
                ExpectedMutationIds = ["mutate-rto-30m"],
            },
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = "deep-intentional-tradeoff",
                Title = "Intentional security vs cost trade-off",
                SourceText = """
                    Cost-sensitive batch ETL. Monthly cost ceiling: $3000 stated in framing.
                    Security wants private endpoints for all data stores; finance rejects added spend.
                    Public HTTPS admin API exists without trust boundary.
                    Cost drivers list compute only without ceiling mapping.
                    """,
                PlantedDefects =
                [
                    new PlantedDefectExpectation
                    {
                        DefectId = "public-admin",
                        TitlePattern = "public",
                        Dimension = QualityDimension.Security,
                        MinSeverity = "High",
                    },
                    new PlantedDefectExpectation
                    {
                        DefectId = "ceiling-gap",
                        TitlePattern = "ceiling",
                        Dimension = QualityDimension.Cost,
                        MinSeverity = "Medium",
                    },
                ],
                ExpectedMutationIds = ["mutate-remove-trust-boundary"],
            },
        ];
    }
}
