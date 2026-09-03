using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Evidence;

public sealed partial class BulkEvidenceUploadService
{
    private async Task UploadSingleEvidenceFileAsync(
        Guid runId,
        string safeBaseName,
        Stream contentStream,
        List<string> uploadedIds,
        List<string> fileNames,
        CancellationToken cancellationToken)
    {
        string evidenceItemId = Guid.NewGuid().ToString("N");
        string blobName = $"evidence/{runId:N}/{evidenceItemId}_{safeBaseName}";

        using MemoryStream ms = new();
        await contentStream.CopyToAsync(ms, cancellationToken);
        string contentBase64 = Convert.ToBase64String(ms.ToArray());

        await blobStore.WriteAsync("artifacts", blobName, contentBase64, cancellationToken);

        uploadedIds.Add(evidenceItemId);
        fileNames.Add(safeBaseName);
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
