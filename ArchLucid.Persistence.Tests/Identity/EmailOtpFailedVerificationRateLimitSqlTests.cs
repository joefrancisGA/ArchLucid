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

    [Fact]
    public void Failed_verification_sql_uses_application_now_parameters_not_sysutcdatetime()
    {
        string sql = EmailOtpFailedVerificationRateLimitSql.Command;

        sql.Should().Contain("@SinceUtc");
        sql.Should().Contain("@NowUtc");
        sql.Should().NotContain("SYSUTCDATETIME", "hourly window is anchored to caller-supplied UTC, not SQL server clock");
    }
}
