using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventorySnapshotMaterializeWriteRequest
{
    public SecureNowAnalysisRecoveryAdmission? AnalysisRecovery { get; init; }

    public AzureInventoryCaptureStatus CaptureStatus
    {
        get;
        init;
    }

    public int ResourceCount
    {
        get;
        init;
    }

    public int RelationshipCount
    {
        get;
        init;
    }

    public decimal? CompletenessScore
    {
        get;
        init;
    }

    public int WarningCount
    {
        get;
        init;
    }

    public string? CompletenessWarningsJson
    {
        get;
        init;
    }

    public int ErrorCount
    {
        get;
        init;
    }

    public byte[]? ContentHashSha256
    {
        get;
        init;
    }

    public AzureInventoryCaptureMethod CaptureMethod
    {
        get;
        init;
    }

    public string? CollectorVersion
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public string? SubscriptionName
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryResourceRecord> Resources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryResourcePropertyWrite> Properties
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryResourceRelationshipWrite> Relationships
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryAdfExternalSourceWrite> AdfExternalSources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryRoleAssignmentWrite> RoleAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryTagWrite> Tags
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDiagnosticConfigurationWrite> Diagnostics
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryUnknownResourceWrite> UnknownResources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderSummaryWrite> DefenderSummaries
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderPricingWrite> DefenderPricings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderScoreControlWrite> DefenderScoreControls
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAssessmentWrite> DefenderAssessments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAssessmentCountWrite> DefenderAssessmentCounts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderSecurityContactWrite> DefenderSecurityContacts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderGovernanceAssignmentWrite> DefenderGovernanceAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderComplianceStandardWrite> DefenderComplianceStandards
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderComplianceControlWrite> DefenderComplianceControls
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAlertWrite> DefenderAlerts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderAttackPathWrite> DefenderAttackPaths
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderVulnerabilityCountWrite> DefenderVulnerabilityCounts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDefenderVulnerabilityFindingWrite> DefenderVulnerabilityFindings
    {
        get;
        init;
    } = [];
}
