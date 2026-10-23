using System.Reflection;

using ArchLucid.Host.Composition.ValueReports;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;

namespace ArchLucid.Host.Composition.Tests.ValueReports;

[Trait("Category", "Unit")]
public sealed class ProcessSharedValueReportJobPollStateCacheTests
{
    [Fact]
    public void Set_prunes_expired_entries_without_get()
    {
        ProcessSharedValueReportJobPollStateCache cache = CreateIsolatedCache();
        byte[] payload = "poll-state"u8.ToArray();

        cache.Set(
            "expired-job",
            payload,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = DateTimeOffset.UtcNow.AddHours(-1),
            });

        cache.Set(
            "fresh-job",
            payload,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2),
            });

        EntryCount(cache).Should().Be(1);
        cache.Get("fresh-job").Should().Equal(payload);
    }

    [Fact]
    public void Remove_missing_key_does_not_throw()
    {
        ProcessSharedValueReportJobPollStateCache cache = CreateIsolatedCache();

        Action act = () => cache.Remove("missing-job");

        act.Should().NotThrow();
    }

    private static ProcessSharedValueReportJobPollStateCache CreateIsolatedCache() =>
        (ProcessSharedValueReportJobPollStateCache)Activator.CreateInstance(
            typeof(ProcessSharedValueReportJobPollStateCache),
            nonPublic: true)!;

    private static int EntryCount(ProcessSharedValueReportJobPollStateCache cache)
    {
        FieldInfo field = typeof(ProcessSharedValueReportJobPollStateCache).GetField(
            "_entries",
            BindingFlags.Instance | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("_entries field not found.");

        System.Collections.ICollection entries = (System.Collections.ICollection)field.GetValue(cache)!;

        return entries.Count;
    }
}
