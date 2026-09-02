using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Wave-4 suggestion 32: resolves pinned extractor package identity at findings time.
/// </summary>
public interface IEvidencePackagePinResolver
{
    Task<EvidencePackagePin?> TryResolveAzurePinAsync(ScopeContext scope, CancellationToken cancellationToken);
}

public sealed class EvidencePackagePinResolver(IAzureExtractorPackageRepository packageRepository) : IEvidencePackagePinResolver
{
    private readonly IAzureExtractorPackageRepository _packageRepository =
        packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));

    public async Task<EvidencePackagePin?> TryResolveAzurePinAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime? collectionUtc = await _packageRepository
            .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        AzureExtractorPackageDownloadRecord? download =
            await _packageRepository.TryGetLatestDownloadInScopeAsync(scope, cancellationToken).ConfigureAwait(false);

        if (download is null)
            return null;

        return new EvidencePackagePin
        {
            PackageId = download.PackageId,
            CollectionUtc = collectionUtc,
            Provider = "azure-extractor",
        };
    }
}
