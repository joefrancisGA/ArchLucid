namespace ArchLucid.Application.Analysis;

/// <summary>
///     Pushes a run export ZIP package directly to a customer-provided Azure Blob Storage SAS URL.
/// </summary>
public interface IRunExportBlobPushService
{
    /// <summary>
    ///     Uploads <paramref name="zipContent" /> to <paramref name="destinationSasUrl" /> via HTTP PUT.
    ///     Logs audit events on success and failure.  Should be called from a background context.
    /// </summary>
    Task PushAsync(
        Guid runId,
        byte[] zipContent,
        string destinationSasUrl,
        CancellationToken cancellationToken = default);
}
