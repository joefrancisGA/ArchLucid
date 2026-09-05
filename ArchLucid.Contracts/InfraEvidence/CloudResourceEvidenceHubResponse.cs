namespace ArchLucid.Contracts.InfraEvidence;

using ArchLucid.Contracts.Architecture;

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

    public List<CloudResourceRbacAssignmentSummary> RbacAssignments
    {
        get;
        set;
    } = [];

    public List<CloudResourceNetworkRelationshipSummary> NetworkRelationships
    {
        get;
        set;
    } = [];

    public List<CloudResourceInventoryChangeSummary> RecentChanges
    {
        get;
        set;
    } = [];

    public CloudResourceAuditLineageLink AuditLineageLink
    {
        get;
        set;
    } = new();

    public List<CloudResourceEvidencePointer> EvidencePointers
    {
        get;
        set;
    } = [];
}
