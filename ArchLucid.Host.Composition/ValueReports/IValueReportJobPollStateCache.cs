using Microsoft.Extensions.Caching.Distributed;

namespace ArchLucid.Host.Composition.ValueReports;

/// <summary>
///     Cross-replica poll state for <see cref="InMemoryValueReportJobQueue" /> (separate from per-process job execution).
/// </summary>
public interface IValueReportJobPollStateCache
{
    void Set(string key, byte[] payload, DistributedCacheEntryOptions options);

    byte[]? Get(string key);
}
