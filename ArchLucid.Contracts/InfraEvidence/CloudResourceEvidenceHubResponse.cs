using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceEvidenceHubResponse
{
    public Guid CloudResourceId
    {
        get;
        set;
    }

    public string ExternalResourceId
    {
        get;
        set;
    } = string.Empty;

    public string? ResourceType
    {
        get;
        set;
    }

    public CloudResourceCurrentConfigurationSection? CurrentConfiguration
    {
        get;
        set;
    }

    public string? TerraformAddress
    {
        get;
        set;
    }

    public string? TerraformGenerationMethod
    {
        get;
        set;
    }

    public DiagramInfrastructureCorrespondenceRow? DiagramCorrespondence
    {
        get;
        set;
    }

    private CloudResourceEvidenceFindingStreamPage operationalSecurityFindings = new();

    public CloudResourceEvidenceFindingStreamPage OperationalSecurityFindings
    {
        get => operationalSecurityFindings;
        set => operationalSecurityFindings = value ?? new CloudResourceEvidenceFindingStreamPage();
    }

    private CloudResourceEvidenceFindingStreamPage architectureReviewFindings = new();

    public CloudResourceEvidenceFindingStreamPage ArchitectureReviewFindings
    {
        get => architectureReviewFindings;
        set => architectureReviewFindings = value ?? new CloudResourceEvidenceFindingStreamPage();
    }

    private CloudResourceRemediationStreamPage remediationInstances = new();

    public CloudResourceRemediationStreamPage RemediationInstances
    {
        get => remediationInstances;
        set => remediationInstances = value ?? new CloudResourceRemediationStreamPage();
    }

    private List<CloudResourceRbacAssignmentSummary> rbacAssignments = [];

    public List<CloudResourceRbacAssignmentSummary> RbacAssignments
    {
        get => rbacAssignments;
        set => rbacAssignments = ContractCollectionDefaults.Coalesce(value);
    }

    private List<CloudResourceNetworkRelationshipSummary> networkRelationships = [];

    public List<CloudResourceNetworkRelationshipSummary> NetworkRelationships
    {
        get => networkRelationships;
        set => networkRelationships = ContractCollectionDefaults.Coalesce(value);
    }

    private List<CloudResourceInventoryChangeSummary> recentChanges = [];

    public List<CloudResourceInventoryChangeSummary> RecentChanges
    {
        get => recentChanges;
        set => recentChanges = ContractCollectionDefaults.Coalesce(value);
    }

    private CloudResourceAuditLineageLink auditLineageLink = new();

    public CloudResourceAuditLineageLink AuditLineageLink
    {
        get => auditLineageLink;
        set => auditLineageLink = value ?? new CloudResourceAuditLineageLink();
    }

    private List<CloudResourceEvidencePointer> evidencePointers = [];

    public List<CloudResourceEvidencePointer> EvidencePointers
    {
        get => evidencePointers;
        set => evidencePointers = ContractCollectionDefaults.Coalesce(value);
    }
}
