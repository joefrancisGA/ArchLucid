using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-6 suggestions 51 and 55: pins scoped extractor package ids (Azure + cloud inventory) at run create.
/// </summary>
public interface IRunEvidencePackagePinService
{
    Task ApplyToRunHeaderAsync(
        RunRecord header,
        ScopeContext scope,
        ArchitectureRequest request,
        CancellationToken cancellationToken);

    IReadOnlyList<EvidencePackagePin> ResolvePinsFromHeader(RunRecord? header);
}

public sealed class RunEvidencePackagePinService(
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackageRepository) : IRunEvidencePackagePinService
{
    public const string AzureProvider = "azure-extractor";
    public const string AwsProvider = "aws-extractor";
    public const string GcpProvider = "gcp-extractor";

    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly ICloudInventoryExtractorPackageRepository _cloudInventoryExtractorPackageRepository =
        cloudInventoryExtractorPackageRepository
        ?? throw new ArgumentNullException(nameof(cloudInventoryExtractorPackageRepository));

    public async Task ApplyToRunHeaderAsync(
        RunRecord header,
        ScopeContext scope,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        List<PinnedEvidencePackageRow> rows = [];

        AzureExtractorPackageDownloadRecord? azureDownload = await _azureExtractorPackageRepository
            .TryGetLatestDownloadInScopeAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        if (azureDownload is not null)
        {
            DateTime? collectionUtc = await _azureExtractorPackageRepository
                .TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken)
                .ConfigureAwait(false);

            rows.Add(new PinnedEvidencePackageRow(AzureProvider, azureDownload.PackageId, collectionUtc));
        }

        CloudInventoryExtractorPackageDownloadRecord? awsDownload = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestDownloadInScopeAsync(scope, CloudProvider.Aws, cancellationToken)
            .ConfigureAwait(false);

        if (awsDownload is not null)
            rows.Add(new PinnedEvidencePackageRow(AwsProvider, awsDownload.PackageId, null));

        CloudInventoryExtractorPackageDownloadRecord? gcpDownload = await _cloudInventoryExtractorPackageRepository
            .TryGetLatestDownloadInScopeAsync(scope, CloudProvider.Gcp, cancellationToken)
            .ConfigureAwait(false);

        if (gcpDownload is not null)
            rows.Add(new PinnedEvidencePackageRow(GcpProvider, gcpDownload.PackageId, null));

        if (rows.Count == 0)
            return;

        PinnedEvidencePackageRow[] ordered = rows
            .OrderBy(static row => row.Provider, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static row => row.PackageId)
            .ToArray();

        string json = JsonSerializer.Serialize(ordered, ContractJson.CamelCaseIgnoreNullCompact);
        header.PinnedEvidencePackagePinsJson = json;
        header.PinnedEvidencePackagePinsHashSha256 = SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    public IReadOnlyList<EvidencePackagePin> ResolvePinsFromHeader(RunRecord? header)
    {
        if (header is null || string.IsNullOrWhiteSpace(header.PinnedEvidencePackagePinsJson))
            return [];

        if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(header.PinnedEvidencePackagePinsJson, out PinnedEvidencePackageRow[] rows))
            return [];

        return rows
            .Select(static row => new EvidencePackagePin
            {
                PackageId = row.PackageId,
                CollectionUtc = row.CollectionUtc,
                Provider = row.Provider,
            })
            .ToArray();
    }
}
