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

    public CloudResourceEvidenceFindingStreamPage OperationalSecurityFindings
    {
        get;
        set;
    } = new();

    public CloudResourceEvidenceFindingStreamPage ArchitectureReviewFindings
    {
        get;
        set;
    } = new();

    public CloudResourceRemediationStreamPage RemediationInstances
    {
        get;
        set;
    } = new();

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

    public CloudResourceAuditLineageLink AuditLineageLink
    {
        get;
        set;
    } = new();

    private List<CloudResourceEvidencePointer> evidencePointers = [];

    public List<CloudResourceEvidencePointer> EvidencePointers
    {
        get => evidencePointers;
        set => evidencePointers = ContractCollectionDefaults.Coalesce(value);
    }
}
