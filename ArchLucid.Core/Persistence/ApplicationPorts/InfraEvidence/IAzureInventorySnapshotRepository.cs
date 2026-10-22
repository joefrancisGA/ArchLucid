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

    /// <summary>Reads all stored evidence without diagram visibility filtering, within the caller's scope.</summary>
    Task<AzureInventorySnapshotDetailReadModel?> TryGetCanonicalSnapshotDetailAsync(
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

    Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)?> ListResourcesBySnapshotIdPagedAsync(
        ScopeContext scope,
        Guid snapshotId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourcesBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
        {
            return null;
        }

        AzureInventorySnapshotDetailReadModel? detail =
            await TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        return detail?.Resources.ToList();
    }

    Task<AzureInventorySnapshotDeleteResult> TryDeleteSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryResourcePropertyReadModel>> ListResourcePropertiesByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryResourcePropertyReadModel>>([]);

    Task<IReadOnlyList<AzureInventoryTagReadModel>> ListResourceTagsByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);

    Task<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>> ListRelationshipsTouchingAzureResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>>([]);

    Task<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>> ListRoleAssignmentsForAzureResourceScopeAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>>([]);

    Task<AzureInventoryDefenderBandContextReadModel?> TryGetDefenderBandContextAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<AzureInventoryDefenderBandContextReadModel?>(null);

    Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourceVisibilityRowsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        ListResourcesBySnapshotIdAsync(scope, snapshotId, cancellationToken);

    Task<IReadOnlyList<AzureInventoryResourceRecord>> ListResourcesByCloudResourceIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> cloudResourceIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(cloudResourceIds);

        if (cloudResourceIds.Count == 0)
            return Task.FromResult<IReadOnlyList<AzureInventoryResourceRecord>>([]);

        return Task.FromResult<IReadOnlyList<AzureInventoryResourceRecord>>([]);
    }

    Task<IReadOnlyList<AzureInventoryTagReadModel>> ListTagsByResourceRowIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> resourceRowIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(resourceRowIds);

        if (resourceRowIds.Count == 0)
            return Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);

        return Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);
    }

    Task<AzureInventorySnapshotDetailReadModel?> TryGetAdvisoryTerraformVisibleSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

    Task<(IReadOnlyList<AzureInventoryResourceRecord> Resources, IReadOnlyList<AzureInventoryResourcePropertyReadModel> Properties)>
        ListResourcesAndPropertiesByCloudResourceIdsAsync(
            ScopeContext scope,
            Guid snapshotId,
            IReadOnlyList<Guid> cloudResourceIds,
            CancellationToken cancellationToken = default) =>
        Task.FromResult<(IReadOnlyList<AzureInventoryResourceRecord>, IReadOnlyList<AzureInventoryResourcePropertyReadModel>)>(
            ([], []));
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

public sealed class AzureInventoryAdfExternalSourceWrite
{
    public string ExternalNodeKey
    {
        get;
        init;
    } = string.Empty;

    public string LinkedServiceName
    {
        get;
        init;
    } = string.Empty;

    public string LinkedServiceType
    {
        get;
        init;
    } = string.Empty;

    public string? TargetHost
    {
        get;
        init;
    }

    public string FactoryResourceId
    {
        get;
        init;
    } = string.Empty;

    public string? IntegrationRuntimeName
    {
        get;
        init;
    }

    public bool HostInKeyVault
    {
        get;
        init;
    }

    public string? KeyVaultResourceId
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

    public string? RoleDefinitionName
    {
        get;
        init;
    }

    public string? PimEligibilityKind
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
