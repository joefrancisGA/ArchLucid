using System.Security.Cryptography;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunIngestService(
    ICollectionRunRepository collectionRunRepository,
    IAzureExtractorIngestService azureExtractorIngestService,
    IScopeContextProvider scopeContextProvider)
{
    private readonly ICollectionRunRepository _collectionRunRepository =
        collectionRunRepository ?? throw new ArgumentNullException(nameof(collectionRunRepository));

    private readonly IAzureExtractorIngestService _azureExtractorIngestService =
        azureExtractorIngestService ?? throw new ArgumentNullException(nameof(azureExtractorIngestService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<CollectionRun> IngestAsync(
        CollectionRunArtifact artifact,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(artifact);
        ArgumentNullException.ThrowIfNull(artifact.Manifest);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CollectionRunManifest manifest = artifact.Manifest;
        byte[] zipHash = SHA256.HashData(artifact.ZipBytes);

        CollectionRun? existingRun = await _collectionRunRepository.GetAsync(
            scope,
            manifest.RunId,
            cancellationToken);
        string? rejectionReason = GetManifestRejectionReason(manifest, scope.TenantId, zipHash);
        if (rejectionReason is null &&
            existingRun?.Status == CollectionRunStatus.Imported &&
            existingRun.ImportedSnapshotId.HasValue &&
            existingRun.ZipSha256 is not null &&
            existingRun.ZipSha256.SequenceEqual(zipHash))
            return existingRun;

        CollectionRun collectionRun = CreateRun(scope, manifest, zipHash);
        if (rejectionReason is not null)
        {
            collectionRun = WithStatus(collectionRun, CollectionRunStatus.Rejected, rejectionReason);
            if (existingRun?.Status != CollectionRunStatus.Imported)
                await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);

            return collectionRun;
        }

        Guid? reusableSnapshotId = await _collectionRunRepository.FindImportedSnapshotIdByHashAsync(scope, zipHash, cancellationToken);
        if (reusableSnapshotId.HasValue)
        {
            collectionRun = collectionRun with
            {
                Status = CollectionRunStatus.Imported,
                ImportedSnapshotId = reusableSnapshotId,
                ErrorSummary = null,
            };
            await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
            return collectionRun;
        }

        AzureExtractorIngestResult importResult = await _azureExtractorIngestService.IngestZipBytesAsync(
            artifact.ZipBytes,
            "collection-run.zip",
            runId: null,
            cancellationToken,
            correlationId: null,
            maxAcceptedZipBytes: AzureExtractorIngestService.MaxUploadedZipBytes);

        bool snapshotImported = importResult.Succeeded && importResult.SnapshotId.HasValue;
        collectionRun = snapshotImported
            ? collectionRun with
            {
                Status = CollectionRunStatus.Imported,
                ImportedSnapshotId = importResult.SnapshotId,
                ErrorSummary = null,
            }
            : WithStatus(
                collectionRun,
                importResult.IsSchemaRejection ? CollectionRunStatus.Rejected : CollectionRunStatus.Failed,
                importResult.Succeeded
                    ? "The uploaded package did not produce an inventory snapshot."
                    : importResult.FailureDetail);

        // A successful import has already written the snapshot. Preserve its link if the caller disconnects.
        await _collectionRunRepository.UpsertAsync(
            collectionRun,
            snapshotImported ? CancellationToken.None : cancellationToken);
        return collectionRun;
    }

    private static string? GetManifestRejectionReason(
        CollectionRunManifest manifest,
        Guid tenantId,
        byte[] zipHash)
    {
        if (!IsImportableManifestStatus(manifest.Status))
            return "Collection manifest is not in an importable terminal status.";

        if (manifest.TenantId is not Guid manifestTenantId)
            return "Collection manifest does not include a tenant identifier.";

        if (manifestTenantId != tenantId)
            return "Collection manifest tenant does not match the current scope.";

        if (!IsManifestHashValid(manifest, zipHash))
            return "Collection package hash does not match the manifest.";

        if (manifest.SchemaVersion != AzureExtractorPackageZipValidator.SupportedSchemaVersion)
            return "Unsupported collection manifest schema version.";

        return null;
    }

    private static CollectionRun CreateRun(
        ScopeContext scope,
        CollectionRunManifest manifest,
        byte[] zipHash) =>
        new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = manifest.RunId,
            AgentVersion = manifest.AgentVersion,
            Schedule = manifest.Schedule,
            StartedUtc = manifest.StartedUtc,
            FinishedUtc = manifest.FinishedUtc,
            Status = ParseStatus(manifest.Status),
            SubscriptionsCoveredJson = System.Text.Json.JsonSerializer.Serialize(manifest.SubscriptionsCovered),
            ErrorSummary = manifest.ErrorSummary,
            ZipPath = manifest.ZipPath,
            ZipSha256 = zipHash,
        };

    private static CollectionRun WithStatus(CollectionRun collectionRun, CollectionRunStatus status, string? error) =>
        new()
        {
            TenantId = collectionRun.TenantId,
            WorkspaceId = collectionRun.WorkspaceId,
            ProjectId = collectionRun.ProjectId,
            RunId = collectionRun.RunId,
            AgentVersion = collectionRun.AgentVersion,
            Schedule = collectionRun.Schedule,
            StartedUtc = collectionRun.StartedUtc,
            FinishedUtc = collectionRun.FinishedUtc,
            Status = status,
            SubscriptionsCoveredJson = collectionRun.SubscriptionsCoveredJson,
            ErrorSummary = error,
            ZipPath = collectionRun.ZipPath,
            ZipSha256 = collectionRun.ZipSha256,
            ImportedSnapshotId = collectionRun.ImportedSnapshotId,
        };

    private static bool IsManifestHashValid(CollectionRunManifest manifest, byte[] actualHash)
    {
        if (string.IsNullOrWhiteSpace(manifest.ZipSha256))
            return true;

        try
        {
            return Convert.FromHexString(manifest.ZipSha256).SequenceEqual(actualHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static CollectionRunStatus ParseStatus(string status) =>
        status.Equals("Partial", StringComparison.OrdinalIgnoreCase)
            ? CollectionRunStatus.PartiallySucceeded
            : Enum.TryParse(status, ignoreCase: true, out CollectionRunStatus parsed)
                ? parsed
                : CollectionRunStatus.Failed;

    private static bool IsImportableManifestStatus(string status) =>
        status.Equals("Succeeded", StringComparison.OrdinalIgnoreCase) ||
        status.Equals("Partial", StringComparison.OrdinalIgnoreCase);
}
