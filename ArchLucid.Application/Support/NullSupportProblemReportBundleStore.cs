using ArchLucid.Core.Support;

namespace ArchLucid.Application.Support;

public sealed class NullSupportProblemReportBundleStore : ISupportProblemReportBundleStore
{
    public Task<string?> TryStoreAsync(
        Guid reportId,
        byte[] zipBytes,
        string fileName,
        CancellationToken cancellationToken)
    {
        _ = reportId;
        _ = zipBytes;
        _ = fileName;
        _ = cancellationToken;

        return Task.FromResult<string?>(null);
    }
}
