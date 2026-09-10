using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Evidence;

public sealed partial class BulkEvidenceUploadService
{
    private async Task UploadSingleEvidenceFileAsync(
        ScopeContext scope,
        string actorUserId,
        Guid runId,
        string safeBaseName,
        string contentType,
        Stream contentStream,
        List<string> uploadedIds,
        List<string> fileNames,
        CancellationToken cancellationToken)
    {
        string evidenceItemId = Guid.NewGuid().ToString("N");
        string blobName = $"evidence/{runId:N}/{evidenceItemId}_{safeBaseName}";

        using MemoryStream ms = new();
        await contentStream.CopyToAsync(ms, cancellationToken);
        byte[] bytes = ms.ToArray();
        string contentBase64 = Convert.ToBase64String(bytes);

        string blobUri = await blobStore.WriteAsync("artifacts", blobName, contentBase64, cancellationToken);

        RunStoredEvidenceFileRecord catalogRow = new()
        {
            EvidenceItemId = evidenceItemId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runId,
            OriginalFileName = safeBaseName,
            ContentType = contentType,
            ByteLength = bytes.LongLength,
            BlobUri = blobUri,
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            ActorUserId = actorUserId,
        };

        await storedEvidenceFileRepository.InsertAsync(catalogRow, cancellationToken);

        uploadedIds.Add(evidenceItemId);
        fileNames.Add(safeBaseName);
    }

    private static string ResolveUploadContentType(string? rawContentType)
    {
        if (string.IsNullOrWhiteSpace(rawContentType))
        {
            return "application/octet-stream";
        }

        return rawContentType.Trim();
    }

    private async Task TryUpdateEvidenceBundleMetadataAsync(
        ScopeContext scope,
        Guid runId,
        int uploadedCount,
        CancellationToken cancellationToken)
    {
        if (uploadedCount <= 0)
            return;

        IReadOnlyList<AgentTask> tasks =
            await agentTaskRepository.GetByRunIdAsync(scope, runId.ToString("N"), cancellationToken).ConfigureAwait(false);

        string? bundleRef = tasks.FirstOrDefault()?.EvidenceBundleRef;

        if (string.IsNullOrWhiteSpace(bundleRef))
            return;

        EvidenceBundle? bundle = await evidenceBundleRepository.GetByIdAsync(bundleRef, cancellationToken).ConfigureAwait(false);

        if (bundle is null)
            return;

        if (bundle.Metadata.TryGetValue(BulkEvidenceMetadataKeys.AttachedFileCountKey, out string? existingRaw)
            && int.TryParse(existingRaw, out int existingCount))
        {
            bundle.Metadata[BulkEvidenceMetadataKeys.AttachedFileCountKey] = (existingCount + uploadedCount).ToString();
        }
        else
        {
            bundle.Metadata[BulkEvidenceMetadataKeys.AttachedFileCountKey] = uploadedCount.ToString();
        }

        bundle.Metadata[BulkEvidenceMetadataKeys.LastAttachedUtcKey] =
            TimeProvider.System.GetUtcNow().UtcDateTime.ToString("O");

        await evidenceBundleRepository.UpdateAsync(bundle, cancellationToken).ConfigureAwait(false);
    }
}
