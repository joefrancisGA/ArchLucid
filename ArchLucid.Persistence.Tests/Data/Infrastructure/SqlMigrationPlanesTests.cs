using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class SqlMigrationPlanesTests
{
    [Fact]
    public void IsSystemPlaneScript_detects_embedded_system_folder()
    {
        const string name = "ArchLucid.Persistence.Migrations.System.001_SystemTenantDirectory.sql";

        SqlMigrationPlanes.IsSystemPlaneScript(name).Should().BeTrue();
        SqlMigrationPlanes.IsTenantPlaneScript(name).Should().BeFalse();
    }

    [Fact]
    public void IsTenantPlaneScript_includes_numeric_migrations_excludes_baseline_and_system()
    {
        SqlMigrationPlanes.IsTenantPlaneScript(
                "ArchLucid.Persistence.Migrations.Baseline.000_Baseline_2026_04_17.sql")
            .Should().BeFalse();

        SqlMigrationPlanes.IsTenantPlaneScript("ArchLucid.Persistence.Migrations.001_InitialSchema.sql")
            .Should().BeTrue();
    }
}
