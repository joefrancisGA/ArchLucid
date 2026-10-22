using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     RC28f package-coverage batch: cache key builders, outbox retry backoff, and SQL connection-string hardening.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatchRc28fTests
{
    [Fact]
    public void IntegrationEventOutboxRetryCalculator_exponential_backoff_caps_at_max_seconds()
    {
        TimeSpan firstAttempt = IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(1, maxBackoffSeconds: 30);
        TimeSpan thirdAttempt = IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(3, maxBackoffSeconds: 30);
        TimeSpan cappedAttempt = IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(10, maxBackoffSeconds: 30);

        firstAttempt.Should().Be(TimeSpan.FromSeconds(2));
        thirdAttempt.Should().Be(TimeSpan.FromSeconds(8));
        cappedAttempt.Should().Be(TimeSpan.FromSeconds(30));
    }

    [Fact]
    public void IntegrationEventOutboxRetryCalculator_throws_for_non_positive_failure_count()
    {
        FluentActions
            .Invoking(() => IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(0, 60))
            .Should()
            .Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void HotPathCacheKeys_manifest_and_run_include_scope_and_entity_ids()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        string manifestKey = HotPathCacheKeys.Manifest(scope, manifestId);
        string runKey = HotPathCacheKeys.Run(scope, runId);

        manifestKey.Should().Contain(tenantId.ToString("N"));
        manifestKey.Should().Contain(manifestId.ToString("N"));
        runKey.Should().Contain(runId.ToString("N"));
        runKey.Should().StartWith("al:hot:");
    }

    [Fact]
    public void HotPathCacheKeys_policy_pack_version_requires_non_blank_version()
    {
        Guid policyPackId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        FluentActions
            .Invoking(() => HotPathCacheKeys.PolicyPackVersion(policyPackId, "  "))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void SqlConnectionStringSecurity_EnsureSqlClientEncryptMandatory_sets_mandatory_encrypt()
    {
        const string input = "Server=localhost;Database=ArchLucid;Integrated Security=true;TrustServerCertificate=True";

        string hardened = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(input, enforceServerCertificateTrust: true);

        SqlConnectionStringBuilder builder = new(hardened);
        builder.Encrypt.Should().Be(SqlConnectionEncryptOption.Mandatory);
        builder.TrustServerCertificate.Should().BeFalse();
    }

    [Fact]
    public void SqlConnectionStringSecurity_EnsureSqlClientEncryptMandatory_rejects_blank_connection_string()
    {
        FluentActions
            .Invoking(() => SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory("  "))
            .Should()
            .Throw<ArgumentException>()
            .WithParameterName("connectionString");
    }
}
