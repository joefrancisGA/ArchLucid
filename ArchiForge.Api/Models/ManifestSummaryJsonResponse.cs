namespace ArchiForge.Api.Models;

public sealed class ManifestSummaryJsonResponse
{
    public string ManifestVersion { get; set; } = string.Empty;

    public string SystemName { get; set; } = string.Empty;

    public int ServiceCount
    {
        get; set;
    }

    public int DatastoreCount
    {
        get; set;
    }

    public int RelationshipCount
    {
        get; set;
    }

    public List<string> RequiredControls { get; set; } = [];

    public List<ManifestSummaryServiceItem> Services { get; set; } = [];

    public List<ManifestSummaryDatastoreItem> Datastores { get; set; } = [];

    public List<ManifestSummaryRelationshipItem> Relationships { get; set; } = [];
}

public sealed class ManifestSummaryServiceItem
{
    public string Name { get; set; } = string.Empty;

    public string ServiceType { get; set; } = string.Empty;

    public string RuntimePlatform { get; set; } = string.Empty;

    public string? Purpose
    {
        get; set;
    }

    public List<string> RequiredControls { get; set; } = [];

    public List<string> Tags { get; set; } = [];
}

public sealed class ManifestSummaryDatastoreItem
{
    public string Name { get; set; } = string.Empty;

    public string DatastoreType { get; set; } = string.Empty;

    public string RuntimePlatform { get; set; } = string.Empty;

    public string? Purpose
    {
        get; set;
    }

    public bool PrivateEndpointRequired
    {
        get; set;
    }

    public bool EncryptionAtRestRequired
    {
        get; set;
    }
}

public sealed class ManifestSummaryRelationshipItem
{
    public string SourceId { get; set; } = string.Empty;

    public string TargetId { get; set; } = string.Empty;

    public string RelationshipType { get; set; } = string.Empty;

    public string? Description
    {
        get; set;
    }
}

