using System.Reflection;

using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

/// <summary>
///     Guards migration 394: Working workspace continuity requires NVARCHAR(MAX) preference values.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class Migration394UserSettingsPreferenceValueWidenSqlTests
{
    [Fact]
    public void Embedded_394_migration_widens_preference_value_to_max()
    {
        string sql = ReadEmbeddedMigration("394_UserSettings_PreferenceValue_Widen.sql");

        sql.Should().Contain("ALTER COLUMN PreferenceValue NVARCHAR(MAX) NOT NULL");
        sql.Should().Contain("c.max_length <= 1024");
    }

    [Fact]
    public void Ordered_tenant_migrations_include_394_after_user_settings_baseline()
    {
        IReadOnlyList<string> ordered = DatabaseMigrator.GetOrderedTenantMigrationResourceNames();

        int userSettingsIndex = ordered
            .Select(static (name, index) => (name, index))
            .First(static tuple => tuple.name.Contains("254_UserSettings", StringComparison.OrdinalIgnoreCase))
            .index;

        int widenIndex = ordered
            .Select(static (name, index) => (name, index))
            .First(static tuple => tuple.name.Contains("394_UserSettings_PreferenceValue_Widen", StringComparison.OrdinalIgnoreCase))
            .index;

        widenIndex.Should().BeGreaterThan(userSettingsIndex);
    }

    private static string ReadEmbeddedMigration(string fileName)
    {
        Assembly asm = typeof(DatabaseMigrator).Assembly;
        string? resourceName = asm.GetManifestResourceNames()
            .SingleOrDefault(name => name.EndsWith(fileName, StringComparison.Ordinal));

        resourceName.Should().NotBeNull($"embedded resource {fileName} must exist");

        if (resourceName is null)
        {
            throw new InvalidOperationException($"Embedded resource {fileName} was not found.");
        }

        using Stream? stream = asm.GetManifestResourceStream(resourceName);

        if (stream is null)
        {
            throw new InvalidOperationException($"Embedded resource {fileName} stream was null.");
        }

        using StreamReader reader = new(stream);
        return reader.ReadToEnd();
    }
}
