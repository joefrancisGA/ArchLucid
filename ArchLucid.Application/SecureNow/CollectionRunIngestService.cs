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
        byte[] zipHash = ResolveHash(manifest, artifact.ZipBytes);

        CollectionRun? existingRun = await _collectionRunRepository.GetAsync(
            scope,
            manifest.RunId,
            cancellationToken);
        if (existingRun?.Status == CollectionRunStatus.Imported &&
            existingRun.ZipSha256 is not null &&
            existingRun.ZipSha256.SequenceEqual(zipHash))
            return existingRun;

        CollectionRun collectionRun = CreateRun(scope, manifest, zipHash);

        if (!IsImportableManifestStatus(manifest.Status))
        {
            collectionRun = WithStatus(
                collectionRun,
                CollectionRunStatus.Rejected,
                "Collection manifest is not in an importable terminal status.");
            await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
            return collectionRun;
        }

        if (manifest.TenantId is not Guid manifestTenantId)
        {
            collectionRun = WithStatus(
                collectionRun,
                CollectionRunStatus.Rejected,
                "Collection manifest does not include a tenant identifier.");
            await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
            return collectionRun;
        }

        if (manifestTenantId != scope.TenantId)
        {
            collectionRun = WithStatus(collectionRun, CollectionRunStatus.Rejected, "Collection manifest tenant does not match the current scope.");
            await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
            return collectionRun;
        }

        if (!IsManifestHashValid(manifest, zipHash))
        {
            collectionRun = WithStatus(collectionRun, CollectionRunStatus.Rejected, "Collection package hash does not match the manifest.");
            await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
            return collectionRun;
        }

        if (manifest.SchemaVersion != AzureExtractorPackageZipValidator.SupportedSchemaVersion)
        {
            collectionRun = WithStatus(collectionRun, CollectionRunStatus.Rejected, "Unsupported collection manifest schema version.");
            await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
            return collectionRun;
        }

        if (await _collectionRunRepository.HasImportedHashAsync(scope, zipHash, cancellationToken))
        {
            collectionRun = WithStatus(collectionRun, CollectionRunStatus.Imported, null);
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

        collectionRun = importResult.Succeeded
            ? collectionRun with
            {
                Status = CollectionRunStatus.Imported,
                ImportedSnapshotId = importResult.SnapshotId,
                ErrorSummary = null,
            }
            : WithStatus(
                collectionRun,
                importResult.IsSchemaRejection ? CollectionRunStatus.Rejected : CollectionRunStatus.Failed,
                importResult.FailureDetail);

        await _collectionRunRepository.UpsertAsync(collectionRun, cancellationToken);
        return collectionRun;
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

    private static byte[] ResolveHash(CollectionRunManifest manifest, byte[] zipBytes)
    {
        if (!string.IsNullOrWhiteSpace(manifest.ZipSha256) &&
            manifest.ZipSha256.Length == 64 &&
            manifest.ZipSha256.All(static character => Uri.IsHexDigit(character)))
        {
            try
            {
                return Convert.FromHexString(manifest.ZipSha256);
            }
            catch (FormatException)
            {
            }
        }

        return SHA256.HashData(zipBytes);
    }

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
