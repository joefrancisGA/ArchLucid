using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Authorization;

[Trait("Category", "Unit")]
public sealed class PermissionsTests
{
    [SkippableFact]
    public void ValidateAndNormalize_rejects_unknown_permission()
    {
        Action act = () => Permissions.ValidateAndNormalize(["Runs.Read", "Not.A.Permission"]);

        act.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public void ValidateAndNormalize_deduplicates_and_trims()
    {
        IReadOnlyList<string> normalized = Permissions.ValidateAndNormalize([" Runs.Read ", "Runs.Read", "Findings.Read"]);

        normalized.Should().Equal("Runs.Read", "Findings.Read");
    }

    [Fact]
    public void Tenant_custom_roles_cannot_assign_platform_only_permission()
    {
        // A recognized permission is not necessarily assignable by a tenant.
        Permissions.IsKnown("Tenants.ManageAny").Should().BeTrue();
        Permissions.IsTenantAssignable("Tenants.ManageAny").Should().BeFalse();
        Permissions.BuiltInAdmin.Should().NotContain("Tenants.ManageAny");

        Action act = () => Permissions.ValidateAndNormalize(["Runs.Read", " Tenants.ManageAny "]);

        act.Should().Throw<ArgumentException>().WithParameterName("permissions");
    }
}
