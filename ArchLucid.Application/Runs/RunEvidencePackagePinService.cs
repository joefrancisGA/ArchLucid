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
///     Wave-6 suggestions 51 and 55; wave-7 suggestions 61, 66, 67, 69: pins scoped extractor packages at create.
/// </summary>
public interface IRunEvidencePackagePinService
{
    Task ApplyToRunHeaderAsync(
        RunRecord header,
        ScopeContext scope,
        ArchitectureRequest request,
        CancellationToken cancellationToken);

    Task VerifyPinIntegrityOrThrowAsync(RunRecord header, ScopeContext scope, CancellationToken cancellationToken);

    IReadOnlyList<EvidencePackagePin> ResolvePinsFromHeader(RunRecord? header);

    bool HasCreateTimePinCommitment(RunRecord? header);
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

        PinnedEvidencePackageRow[] ordered = await BuildPinnedRowsAsync(scope, cancellationToken).ConfigureAwait(false);

        if (ordered.Length == 0)
            return;

        (string json, byte[] hash) = SerializePinnedRows(ordered);
        header.PinnedEvidencePackagePinsJson = json;
        header.PinnedEvidencePackagePinsHashSha256 = hash;
    }

    public async Task VerifyPinIntegrityOrThrowAsync(
        RunRecord header,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(header.PinnedEvidencePackagePinsJson))
            return;

        if (header.PinnedEvidencePackagePinsHashSha256 is null || header.PinnedEvidencePackagePinsHashSha256.Length == 0)
        {
            throw new ConflictException(
                "Commit blocked: run has evidence package pin JSON but is missing the create-time pin hash.");
        }

        if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(header.PinnedEvidencePackagePinsJson, out _))
        {
            throw new ConflictException(
                "Commit blocked: evidence package pin JSON is not a valid PinnedEvidencePackageRow array.");
        }

        byte[] jsonHash = SHA256.HashData(Encoding.UTF8.GetBytes(header.PinnedEvidencePackagePinsJson));

        if (!jsonHash.AsSpan().SequenceEqual(header.PinnedEvidencePackagePinsHashSha256))
        {
            throw new ConflictException(
                "Commit blocked: evidence package pin JSON no longer matches the stored create-time pin hash.");
        }

        PinnedEvidencePackageRow[] rebuilt = await BuildPinnedRowsAsync(scope, cancellationToken).ConfigureAwait(false);
        (_, byte[] rebuiltHash) = SerializePinnedRows(rebuilt);

        if (!rebuiltHash.AsSpan().SequenceEqual(header.PinnedEvidencePackagePinsHashSha256))
        {
            throw new ConflictException(
                "Commit blocked: evidence package pin drifted since run create (extractor inventory changed).");
        }
    }

    public IReadOnlyList<EvidencePackagePin> ResolvePinsFromHeader(RunRecord? header)
    {
        if (header is null || string.IsNullOrWhiteSpace(header.PinnedEvidencePackagePinsJson))
            return [];

        if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(header.PinnedEvidencePackagePinsJson, out PinnedEvidencePackageRow[] rows))
        {
            throw new ConflictException(
                "Finding analysis blocked: evidence package pin JSON is not a valid PinnedEvidencePackageRow array.");
        }

        return rows
            .Select(static row => new EvidencePackagePin
            {
                PackageId = row.PackageId,
                CollectionUtc = row.CollectionUtc,
                Provider = row.Provider,
            })
            .ToArray();
    }

    public bool HasCreateTimePinCommitment(RunRecord? header) =>
        header?.PinnedEvidencePackagePinsHashSha256 is { Length: > 0 };

    internal static (string Json, byte[] HashSha256) SerializePinnedRows(IReadOnlyList<PinnedEvidencePackageRow> ordered)
    {
        PinnedEvidencePackageRow[] normalized = ordered
            .OrderBy(static row => row.Provider, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static row => row.PackageId)
            .ToArray();

        string json = JsonSerializer.Serialize(normalized, ContractJson.CamelCaseIgnoreNullCompact);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(json));

        return (json, hash);
    }

    private async Task<PinnedEvidencePackageRow[]> BuildPinnedRowsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
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

        return rows
            .OrderBy(static row => row.Provider, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static row => row.PackageId)
            .ToArray();
    }
}
