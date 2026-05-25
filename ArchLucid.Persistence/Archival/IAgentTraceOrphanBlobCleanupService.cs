namespace ArchLucid.Persistence.Archival;

/// <summary>Deletes aged agent-trace blobs whose run no longer exists in authority storage.</summary>
public interface IAgentTraceOrphanBlobCleanupService
{
    /// <summary>Returns the number of blob objects deleted during the pass.</summary>
    Task<int> DeleteOrphanedBlobsAsync(DataArchivalBlobCleanupOptions options, CancellationToken cancellationToken);
}
