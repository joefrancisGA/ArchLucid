using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EmailOtpHourlyRequestRateLimitSqlTests
{
    [Fact]
    public void Batch_email_count_ignores_completed_and_expired_challenges()
    {
        string batch = EmailOtpHourlyRequestRateLimitSql.Batch;
        int firstSelect = batch.IndexOf("SELECT COUNT(1)", StringComparison.Ordinal);
        int secondSelect = batch.IndexOf("SELECT COUNT(1)", firstSelect + 1, StringComparison.Ordinal);
        string emailQuery = batch[..secondSelect];

        emailQuery.Should().Contain("CompletedUtc IS NULL");
        emailQuery.Should().Contain("ExpiresUtc > @NowUtc");
    }
}
