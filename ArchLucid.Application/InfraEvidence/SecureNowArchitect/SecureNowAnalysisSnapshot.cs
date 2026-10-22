using System.Collections.ObjectModel;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Stable row collections and lazily prepared, read-only indexes for one analysis input.</summary>
internal sealed class SecureNowAnalysisSnapshot
{
    private readonly Lazy<IReadOnlyDictionary<string, AzureInventoryResourceRecord>> _resourcesByArmId;
    private readonly Lazy<IReadOnlyDictionary<Guid, IReadOnlyList<AzureInventoryTagReadModel>>> _tagsByRowId;
    private readonly Lazy<IReadOnlyDictionary<Guid, IReadOnlyList<AzureInventoryResourcePropertyReadModel>>> _propertiesByRowId;
    private readonly Lazy<IReadOnlyDictionary<string, Guid>> _cloudResourceIdsByArmId;
    private readonly Lazy<IReadOnlyDictionary<Guid, string?>> _resourceTypesByCloudResourceId;

    public SecureNowAnalysisSnapshot(AzureInventorySnapshotDetailReadModel source)
    {
        Snapshot = new AzureInventorySnapshotDetailReadModel
        {
            Header = source.Header,
            Resources = Array.AsReadOnly(source.Resources.ToArray()),
            Properties = Array.AsReadOnly(source.Properties.ToArray()),
            Tags = Array.AsReadOnly(source.Tags.ToArray()),
            Relationships = Array.AsReadOnly(source.Relationships.ToArray()),
            AdfExternalSources = Array.AsReadOnly(source.AdfExternalSources.ToArray()),
            RoleAssignments = Array.AsReadOnly(source.RoleAssignments.ToArray()),
            Diagnostics = Array.AsReadOnly(source.Diagnostics.ToArray()),
            DefenderSummaries = Array.AsReadOnly(source.DefenderSummaries.ToArray()),
            DefenderPricings = Array.AsReadOnly(source.DefenderPricings.ToArray()),
            DefenderScoreControls = Array.AsReadOnly(source.DefenderScoreControls.ToArray()),
            DefenderAssessments = Array.AsReadOnly(source.DefenderAssessments.ToArray()),
            DefenderAssessmentCounts = Array.AsReadOnly(source.DefenderAssessmentCounts.ToArray()),
            DefenderSecurityContacts = Array.AsReadOnly(source.DefenderSecurityContacts.ToArray()),
        };
        _resourcesByArmId = new(() => new ReadOnlyDictionary<string, AzureInventoryResourceRecord>(Snapshot.Resources.ToDictionary(
            resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase)));
        _tagsByRowId = new(() => new ReadOnlyDictionary<Guid, IReadOnlyList<AzureInventoryTagReadModel>>(Snapshot.Tags.GroupBy(tag => tag.ResourceRowId).ToDictionary(
            group => group.Key, group => (IReadOnlyList<AzureInventoryTagReadModel>)Array.AsReadOnly(group.ToArray()))));
        _propertiesByRowId = new(() => new ReadOnlyDictionary<Guid, IReadOnlyList<AzureInventoryResourcePropertyReadModel>>(Snapshot.Properties.GroupBy(property => property.ResourceRowId).ToDictionary(
            group => group.Key, group => (IReadOnlyList<AzureInventoryResourcePropertyReadModel>)Array.AsReadOnly(group.ToArray()))));
        _cloudResourceIdsByArmId = new(() => new ReadOnlyDictionary<string, Guid>(Snapshot.Resources
            .Where(resource => resource.CloudResourceId is Guid id && id != Guid.Empty)
            .ToDictionary(resource => resource.AzureResourceId, resource => resource.CloudResourceId!.Value,
                StringComparer.OrdinalIgnoreCase)));
        _resourceTypesByCloudResourceId = new(() => new ReadOnlyDictionary<Guid, string?>(Snapshot.Resources
            .Where(resource => resource.CloudResourceId is Guid id && id != Guid.Empty)
            .GroupBy(resource => resource.CloudResourceId!.Value)
            .ToDictionary(group => group.Key, group => (string?)group.First().ResourceType)));
    }

    public AzureInventorySnapshotDetailReadModel Snapshot { get; }
    public IReadOnlyDictionary<string, AzureInventoryResourceRecord> ResourcesByArmId => _resourcesByArmId.Value;
    public IReadOnlyDictionary<Guid, IReadOnlyList<AzureInventoryTagReadModel>> TagsByResourceRowId => _tagsByRowId.Value;
    public IReadOnlyDictionary<Guid, IReadOnlyList<AzureInventoryResourcePropertyReadModel>> PropertiesByResourceRowId => _propertiesByRowId.Value;
    public IReadOnlyDictionary<string, Guid> CloudResourceIdsByArmId => _cloudResourceIdsByArmId.Value;
    public IReadOnlyDictionary<Guid, string?> ResourceTypesByCloudResourceId => _resourceTypesByCloudResourceId.Value;
}
