using ArchLucid.Core.Diagnostics;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Archival;

internal static class AgentTraceOrphanBlobDeleter
{
    internal static int DeleteLocalOrphanFiles(IReadOnlyList<string> filePaths)
    {
        int deleted = 0;

        foreach (string filePath in filePaths)
        {
            File.Delete(filePath);
            deleted++;
            ArchLucidInstrumentation.DataArchivalBlobsDeletedTotal.Add(1);
        }

        TryDeleteEmptyRunDirectories(filePaths);

        return deleted;
    }

    internal static async Task<int> DeleteAzureOrphanBlobsAsync(
        BlobContainerClient container,
        IReadOnlyList<string> blobNames,
        CancellationToken cancellationToken)
    {
        int deleted = 0;

        foreach (string blobName in blobNames)
        {
            await container.DeleteBlobIfExistsAsync(
                    blobName,
                    DeleteSnapshotsOption.IncludeSnapshots,
                    cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            deleted++;
            ArchLucidInstrumentation.DataArchivalBlobsDeletedTotal.Add(1);
        }

        return deleted;
    }

    internal static void TryDeleteEmptyRunDirectories(IReadOnlyList<string> filePaths)
    {
        foreach (string filePath in filePaths)
        {
            string? directory = Path.GetDirectoryName(filePath);

            while (!string.IsNullOrEmpty(directory))
            {
                if (Directory.Exists(directory) && !Directory.EnumerateFileSystemEntries(directory).Any())
                    Directory.Delete(directory);
                else
                    break;

                directory = Path.GetDirectoryName(directory);
            }
        }
    }

    internal static void LogLocalDeletion(ILogger logger, int deleted)
    {
        if (deleted > 0)
            logger.LogInformation("Agent trace blob cleanup: deleted {Count} orphaned local blob file(s).", deleted);
    }

    internal static void LogAzureDeletion(ILogger logger, int deleted, DateTimeOffset cutoff)
    {
        if (deleted > 0)
        {
            logger.LogInformation(
                "Agent trace blob cleanup: deleted {Count} orphaned Azure blob(s) older than cutoff {Cutoff:O}.",
                deleted,
                cutoff);
        }
    }
}
