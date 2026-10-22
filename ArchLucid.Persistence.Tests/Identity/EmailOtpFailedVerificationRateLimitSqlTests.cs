using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EmailOtpFailedVerificationRateLimitSqlTests
{
    [Fact]
    public void Active_replacement_probe_ignores_expired_unused_challenges()
    {
        string sql = EmailOtpFailedVerificationRateLimitSql.Command;
        int existsAt = sql.IndexOf("NOT EXISTS", StringComparison.Ordinal);
        string activeProbe = sql[existsAt..];

        activeProbe.Should().Contain("ExpiresUtc > @NowUtc");
    }
}
