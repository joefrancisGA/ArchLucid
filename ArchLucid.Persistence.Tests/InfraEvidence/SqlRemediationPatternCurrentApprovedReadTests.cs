using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;
using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

/// <summary>
/// SQL-backed proof that a signing-side pattern read cannot silently select
/// a retired, foreign-tenant or previously approved pattern version.
/// A pattern is NOT a FND-015 deployment plan or signing authorization.
/// </summary>
[Collection(nameof(SqlServerDisposablePersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", SqlServerDisposablePersistenceFixture.Category)]
[Trait("Category", "Integration")]
[Trait("Suite", "Persistence")]
public sealed class SqlRemediationPatternCurrentApprovedReadTests(SqlServerDisposablePersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Current_approved_pattern_read_rechecks_tenant_pointer_and_status()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlRemediationPatternRepository repository =
            new(new SqlConnectionFactory(fixture.ConnectionString));
        Guid tenantId = Guid.NewGuid();
        Guid foreignTenant = Guid.NewGuid();
        Guid patternId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        RemediationPatternRecord pattern = new()
        {
            PatternId = patternId,
            TenantId = tenantId,
            PatternKey = "test.current-version." + patternId.ToString("N"),
            DisplayName = "Approved-version read test",
            CreatedByActorKey = "test-author",
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        RemediationPatternVersionRecord version1 = NewVersion(
            tenantId, patternId, "1.0.0", now);
        await repository.InsertDraftWithVersionAsync(pattern, version1);

        (await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId))
            .Should().BeNull("draft versions must never be treated as approved");
        (await repository.TryGetCurrentApprovedVersionAsync(foreignTenant, patternId))
            .Should().BeNull("tenant predicates must be enforced inside the joined read");

        bool approved = await repository.TryApproveVersionAsync(
            Approved(version1, now), RemediationPatternStatus.Draft);
        approved.Should().BeTrue();

        RemediationPatternApprovedVersionRecord? first =
            await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId);
        first.Should().NotBeNull();
        first!.Pattern.CurrentApprovedVersion.Should().Be("1.0.0");
        first.Version.VersionId.Should().Be(version1.VersionId);
        first.Version.Status.Should().Be(RemediationPatternStatus.Approved);

        RemediationPatternVersionRecord version2 = NewVersion(
            tenantId, patternId, "2.0.0", now.AddMinutes(1));
        await repository.InsertVersionAsync(version2);
        (await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId))!
            .Version.Version.Should().Be("1.0.0",
                "an unapproved newer version cannot replace the current pointer");

        (await repository.TryApproveVersionAsync(
            Approved(version2, now.AddMinutes(1)), RemediationPatternStatus.Draft))
            .Should().BeTrue();

        RemediationPatternApprovedVersionRecord? current =
            await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId);
        current.Should().NotBeNull();
        current!.Version.Version.Should().Be("2.0.0");
        current.Pattern.CurrentApprovedVersion.Should().Be("2.0.0");

        // Old versions may remain Approved; only the current pointer is authoritative.
        (await repository.TryGetVersionAsync(tenantId, patternId, "1.0.0"))!
            .Status.Should().Be(RemediationPatternStatus.Approved);
        (await repository.TryGetCurrentApprovedVersionAsync(foreignTenant, patternId))
            .Should().BeNull();

        // Directly corrupted SQL approval metadata must never be promoted to
        // independent approval just because Status remains Approved.
        await using (SqlConnection sql = new(fixture.ConnectionString))
        {
            await sql.OpenAsync();
            const string modify = """
                UPDATE dbo.RemediationPatternVersions
                SET ApprovedByActorKey = @Actor,
                    ApprovedUtc = @ApprovalUtc
                WHERE TenantId = @TenantId AND PatternId = @PatternId
                  AND VersionId = @VersionId;
                """;
            object scope = new
            {
                TenantId = tenantId, PatternId = patternId,
                VersionId = version2.VersionId,
                Actor = "TEST-AUTHOR",
                ApprovalUtc = (DateTime?)now,
            };
            await sql.ExecuteAsync(modify, scope);
            (await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId))
                .Should().BeNull("self-approved pattern metadata cannot establish independent authority");

            await sql.ExecuteAsync(modify, new
            {
                TenantId = tenantId, PatternId = patternId,
                VersionId = version2.VersionId,
                Actor = "independent-test-approver",
                ApprovalUtc = (DateTime?)null,
            });
            (await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId))
                .Should().BeNull("missing approval timestamp cannot establish current approval");

            await sql.ExecuteAsync(modify, new
            {
                TenantId = tenantId, PatternId = patternId,
                VersionId = version2.VersionId,
                Actor = "independent-test-approver",
                ApprovalUtc = (DateTime?)now,
            });
        }

        (await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId))
            .Should().NotBeNull("repaired independent approval metadata is admissible");

        await repository.UpdateVersionAsync(new RemediationPatternVersionRecord
        {
            VersionId = version2.VersionId,
            PatternId = patternId,
            TenantId = tenantId,
            Version = version2.Version,
            Status = RemediationPatternStatus.Retired,
            UpdatedUtc = now.AddMinutes(2),
        });

        (await repository.TryGetCurrentApprovedVersionAsync(tenantId, patternId))
            .Should().BeNull("a retired current version cannot fall back to older approvals");
    }

    [Fact]
    public async Task NoOp_repository_current_approval_defaults_to_fail_closed()
    {
        IRemediationPatternRepository unsupported = new NoOpRemediationPatternRepository();
        RemediationPatternApprovedVersionRecord? result = await unsupported
            .TryGetCurrentApprovedVersionAsync(Guid.NewGuid(), Guid.NewGuid());
        result.Should().BeNull();
    }

    private static RemediationPatternVersionRecord NewVersion(
        Guid tenantId, Guid patternId, string version, DateTime now) => new()
    {
        VersionId = Guid.NewGuid(),
        TenantId = tenantId,
        PatternId = patternId,
        Version = version,
        Status = RemediationPatternStatus.Draft,
        ControlObjective = "Offline-only pattern test",
        ContentJson = "{}",
        AutomationLevel = RemediationAutomationLevel.Manual,
        AuthorActorKey = "test-author",
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private static RemediationPatternVersionRecord Approved(
        RemediationPatternVersionRecord prior, DateTime now) => new()
    {
        VersionId = prior.VersionId,
        PatternId = prior.PatternId,
        TenantId = prior.TenantId,
        Version = prior.Version,
        Status = RemediationPatternStatus.Approved,
        ControlObjective = prior.ControlObjective,
        ContentJson = prior.ContentJson,
        AutomationLevel = prior.AutomationLevel,
        AuthorActorKey = prior.AuthorActorKey,
        ApprovedByActorKey = "independent-test-approver",
        ApprovedUtc = now,
        CreatedUtc = prior.CreatedUtc,
        UpdatedUtc = now,
    };
}
