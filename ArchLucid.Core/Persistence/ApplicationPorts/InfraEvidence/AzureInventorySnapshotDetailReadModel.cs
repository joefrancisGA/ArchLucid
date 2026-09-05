namespace ArchLucid.Persistence.InfraEvidence;

using ArchLucid.Core.InfraEvidence;

/// <summary>Normalized snapshot rows loaded for diffing or advisory Terraform generation.</summary>
public sealed class AzureInventorySnapshotDetailReadModel
{
    public AzureInventorySnapshotRecord Header
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AzureInventoryResourceRecord> Resources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryResourcePropertyReadModel> Properties
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryTagReadModel> Tags
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryResourceRelationshipReadModel> Relationships
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryRoleAssignmentReadModel> RoleAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryDiagnosticConfigurationReadModel> Diagnostics
    {
        get;
        init;
    } = [];
}

public sealed class AzureInventoryResourcePropertyReadModel
{
    public Guid ResourceRowId
    {
        get;
        init;
    }

    public string PropertyKey
    {
        get;
        init;
    } = string.Empty;

    public string? PropertyValue
    {
        get;
        init;
    }

    public bool IsRedacted
    {
        get;
        init;
    }
}

public sealed class AzureInventoryTagReadModel
{
    public Guid ResourceRowId
    {
        get;
        init;
    }

    public string TagKey
    {
        get;
        init;
    } = string.Empty;

    public string? TagValue
    {
        get;
        init;
    }
}

public sealed class AzureInventoryResourceRelationshipReadModel
{
    public string FromAzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ToAzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string RelationshipType
    {
        get;
        init;
    } = string.Empty;

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }
}

public sealed class AzureInventoryRoleAssignmentReadModel
{
    public string Scope
    {
        get;
        init;
    } = string.Empty;

    public string PrincipalId
    {
        get;
        init;
    } = string.Empty;

    public string RoleDefinitionId
    {
        get;
        init;
    } = string.Empty;
}

public sealed class AzureInventoryDiagnosticConfigurationReadModel
{
    public string TargetAzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string DiagnosticName
    {
        get;
        init;
    } = string.Empty;

    public string? WorkspaceResourceId
    {
        get;
        init;
    }
}
