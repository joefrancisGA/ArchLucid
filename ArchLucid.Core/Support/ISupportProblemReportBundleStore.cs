namespace ArchLucid.Core.Support;

public interface ISupportProblemReportBundleStore
{
    /// <summary>
    ///     Persists a redacted support-bundle ZIP for a problem report. Returns a blob URI/path, or null when storage is
    ///     unavailable.
    /// </summary>
    Task<string?> TryStoreAsync(Guid reportId, byte[] zipBytes, string fileName, CancellationToken cancellationToken);
}
