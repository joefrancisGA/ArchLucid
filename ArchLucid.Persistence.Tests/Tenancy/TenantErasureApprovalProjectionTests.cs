using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantErasureApprovalProjectionTests
{
    [Fact]
    public void Sql_row_mapper_preserves_approved_erasure_timestamp_and_actor()
    {
        DateTimeOffset now = new(2026, 11, 22, 14, 00, 00, TimeSpan.Zero);
        Guid tenantId = Guid.NewGuid();
        TenantSqlRow row = new()
        {
            Id = tenantId,
            Name = "Erasure approval",
            Slug = "approved-tenant",
            Tier = "Standard",
            DataRegion = "westeurope",
            TenantErasureRequestedUtc = now.AddDays(-2),
            OffboardedUtc = now.AddDays(-2),
            ErasureEligibleUtc = now.AddDays(28),
            TenantErasureApprovedUtc = now,
            TenantErasureApprovedByUserId = "admin-reviewer",
            LegalHoldUntilUtc = now.AddDays(5)
        };

        TenantRecord mapped = TenantRepositoryCore.MapSqlRowToRecord(row);

        mapped.Id.Should().Be(tenantId);
        mapped.TenantErasureApprovedUtc.Should().Be(now);
        mapped.TenantErasureApprovedByUserId.Should().Be("admin-reviewer");
        mapped.TenantErasureRequestedUtc.Should().Be(now.AddDays(-2));
        mapped.OffboardedUtc.Should().Be(now.AddDays(-2));
        mapped.LegalHoldUntilUtc.Should().Be(now.AddDays(5));
        mapped.DataRegion.Should().Be("westeurope");
        TenantRepositoryCore.CanApproveTenantErasure(mapped).Should().BeFalse();
        TenantRepositoryCore.CanRevertTenantErasureApproval(mapped).Should().BeTrue();
    }

    [Fact]
    public void Unapproved_sql_row_remains_unapproved_after_mapping()
    {
        DateTimeOffset now = new(2026, 11, 22, 14, 00, 00, TimeSpan.Zero);
        TenantSqlRow row = new()
        {
            Id = Guid.NewGuid(),
            Name = "Pending approval",
            Slug = "pending-tenant",
            Tier = "Standard",
            OffboardedUtc = now,
            TenantErasureApprovedUtc = null,
            TenantErasureApprovedByUserId = null
        };

        TenantRecord mapped = TenantRepositoryCore.MapSqlRowToRecord(row);

        mapped.TenantErasureApprovedUtc.Should().BeNull();
        mapped.TenantErasureApprovedByUserId.Should().BeNull();
        TenantRepositoryCore.CanApproveTenantErasure(mapped).Should().BeTrue();
        TenantRepositoryCore.CanRevertTenantErasureApproval(mapped).Should().BeFalse();
    }

    [Fact]
    public void All_tenant_directory_queries_project_both_erasure_approval_fields()
    {
        string[] queries =
        [
            TenantDirectorySql.SelectById,
            TenantDirectorySql.SelectBySlug,
            TenantDirectorySql.SelectByNormalizedOrganizationName,
            TenantDirectorySql.SelectByEntraTenantId,
            TenantDirectorySql.ListOrderByCreatedUtcDesc
        ];

        foreach (string sql in queries)
        {
            sql.Should().Contain("TenantErasureApprovedUtc");
            sql.Should().Contain("TenantErasureApprovedByUserId");
        }
    }
}
