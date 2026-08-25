using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantHardPurgeOptionsTests
{
    [Fact]
    public void TenantHardPurgeOptions_defaults_and_flags()
    {
        TenantHardPurgeOptions defaults = new();

        defaults.DryRun.Should().BeFalse();
        defaults.MaxRowsPerStatement.Should().Be(5000);
        defaults.DeleteTenantScopedAuditEvents.Should().BeFalse();

        TenantHardPurgeOptions configured = new()
        {
            DryRun = true,
            MaxRowsPerStatement = 250,
            DeleteTenantScopedAuditEvents = true,
        };

        configured.DryRun.Should().BeTrue();
        configured.MaxRowsPerStatement.Should().Be(250);
        configured.DeleteTenantScopedAuditEvents.Should().BeTrue();
    }
}
