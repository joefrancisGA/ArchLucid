using System.Reflection;
using System.Text.Json;

using ArchLucid.Application.Roi;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlTenantSettingsRepositoryValidationTests
{
    private const int MigrationSettingKeyMaxLength = 128;
    private const int MigrationSettingValueMaxLength = 512;

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

    [Fact]
    public void EnsureSettingValueLength_rejects_values_longer_than_migration_nvarchar_512_limit()
    {
        string tooLong = new('v', MigrationSettingValueMaxLength + 1);

        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(tooLong);

        act.Should().Throw<ArgumentException>()
            .WithMessage($"*at most {MigrationSettingValueMaxLength}*");
    }

    [Fact]
    public void Serialized_realized_value_attestation_at_note_max_length_exceeds_migration_setting_value_limit()
    {
        string note = new('n', RealizedValueAttestationUpsertValidation.NoteMaxLength);
        string json = JsonSerializer.Serialize(new
        {
            AttestedIncidentsAvoided = 1,
            AttestedRevenueOrRetentionImpact = note,
            AttestedReviewerTimeSavedNote = note,
        });

        json.Length.Should().BeGreaterThan(MigrationSettingValueMaxLength);
    }
}
