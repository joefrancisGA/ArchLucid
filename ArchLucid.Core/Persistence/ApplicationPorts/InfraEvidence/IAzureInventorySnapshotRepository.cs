using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAzureInventorySnapshotRepository
{
    Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default);

    Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default);

    Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task MaterializeSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotMaterializeWriteRequest writeRequest,
        CancellationToken cancellationToken = default);

    Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
        ScopeContext scope,
        string subscriptionId,
        Guid newerSnapshotId,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventorySnapshotMaterializeWriteRequest
{
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
}

public sealed class AzureInventoryResourcePropertyWrite
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

public sealed class AzureInventoryResourceRelationshipWrite
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

    public decimal? Confidence
    {
        get;
        init;
    }

    public string? InferenceSource
    {
        get;
        init;
    }
}

public sealed class AzureInventoryRoleAssignmentWrite
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

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}

public sealed class AzureInventoryTagWrite
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

public sealed class AzureInventoryDiagnosticConfigurationWrite
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

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}

public sealed class AzureInventoryUnknownResourceWrite
{
    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ResourceType
    {
        get;
        init;
    } = string.Empty;

    public string? ResourceGroup
    {
        get;
        init;
    }

    public string? CappedPropertiesJson
    {
        get;
        init;
    }

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}
