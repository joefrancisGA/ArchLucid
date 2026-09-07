using System.Reflection;

using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlTenantSettingsRepositoryValidationTests
{
    private const int MigrationSettingKeyMaxLength = 128;

    [Fact]
    public void Longest_known_production_setting_key_fits_migration_nvarchar_128_limit()
    {
        int maxConstantLength = typeof(TenantSettingKeys)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(field => field is { IsLiteral: true, FieldType: var fieldType } && fieldType == typeof(string))
            .Select(field => ((string)field.GetRawConstantValue()!).Length)
            .Max();

        int maxDynamicLength = Math.Max(
            TenantSettingKeys.FeaturedCompletedSampleRunId.Length + 1 + 36,
            TenantSettingKeys.RealizedValueAttestation.Length + 1 + 36);

        Math.Max(maxConstantLength, maxDynamicLength).Should().BeLessThanOrEqualTo(MigrationSettingKeyMaxLength);
    }
}
