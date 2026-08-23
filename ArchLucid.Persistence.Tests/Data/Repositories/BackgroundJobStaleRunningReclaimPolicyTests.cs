using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class BackgroundJobStaleRunningReclaimPolicyTests
{
    [Theory]
    [InlineData(0, 0, true)]
    [InlineData(1, 0, false)]
    [InlineData(0, 3, true)]
    [InlineData(2, 3, true)]
    [InlineData(3, 3, false)]
    public void IsEligibleForPendingReclaim_matches_watchdog_sql_predicate(
        int retryCount,
        int maxRetries,
        bool expected)
    {
        bool actual = BackgroundJobStaleRunningReclaimPolicy.IsEligibleForPendingReclaim(retryCount, maxRetries);

        actual.Should().Be(expected);
    }
}
