using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

internal static class RemediationInstanceVerificationSnapshotReader
{
    public static async Task<AzureInventorySnapshotDetailReadModel?> TryLoadVerificationSnapshotAsync(
        IAzureInventorySnapshotRepository snapshotRepository,
        ScopeContext scope,
        Guid verificationSnapshotId,
        Guid? cloudResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshotRepository);
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, verificationSnapshotId, cancellationToken);

        if (header is null)
            return null;

        List<AzureInventoryResourceRecord> resources = [];
        List<AzureInventoryResourcePropertyReadModel> properties = [];

        if (cloudResourceId is Guid resourceId && resourceId != Guid.Empty)
        {
            (IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)? paged =
                await snapshotRepository.ListResourcesBySnapshotIdPagedAsync(
                    scope,
                    verificationSnapshotId,
                    page: 1,
                    pageSize: 1,
                    cloudResourceId: resourceId,
                    cancellationToken);

            AzureInventoryResourceRecord? resource = paged?.Items.FirstOrDefault();

            if (resource is not null)
            {
                resources.Add(resource);

                IReadOnlyList<AzureInventoryResourcePropertyReadModel> resourceProperties =
                    await snapshotRepository.ListResourcePropertiesByResourceRowIdAsync(
                        scope,
                        verificationSnapshotId,
                        resource.ResourceRowId,
                        cancellationToken);

                properties.AddRange(resourceProperties);
            }
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = header,
            Resources = resources,
            Properties = properties,
        };
    }
}
