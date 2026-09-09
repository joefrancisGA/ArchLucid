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
        string tooLong = new('v', TenantSettingsSchemaLimits.SettingValueMaxLength + 1);

        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(tooLong);

        act.Should().Throw<ArgumentException>()
            .WithMessage($"*at most {TenantSettingsSchemaLimits.SettingValueMaxLength}*");
    }

    [Fact]
    public void Serialized_realized_value_attestation_at_note_max_length_fits_migration_setting_value_limit()
    {
        string note = new('n', RealizedValueAttestationUpsertValidation.NoteMaxLength);
        string json = JsonSerializer.Serialize(new
        {
            AttestedIncidentsAvoided = 1,
            AttestedRevenueOrRetentionImpact = note,
            AttestedReviewerTimeSavedNote = note,
        });

        json.Length.Should().BeLessThanOrEqualTo(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    [Fact]
    public void Serialized_realized_value_attestation_at_legacy_note_length_exceeds_migration_setting_value_limit()
    {
        const int legacyNoteMaxLength = 2000;
        string note = new('n', legacyNoteMaxLength);
        string json = JsonSerializer.Serialize(new
        {
            AttestedIncidentsAvoided = 1,
            AttestedRevenueOrRetentionImpact = note,
            AttestedReviewerTimeSavedNote = note,
        });

        json.Length.Should().BeGreaterThan(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    [Fact]
    public void Serialized_allowed_engine_set_with_fourteen_aliases_exceeds_migration_setting_value_limit()
    {
        List<string> aliasIds = Enumerable
            .Range(1, 14)
            .Select(index => $"managed-azure-openai-alias-{index:D2}")
            .ToList();

        string json = JsonSerializer.Serialize(
            new
            {
                allowedAliasIds = aliasIds,
                defaultAliasId = aliasIds[0],
            });

        json.Length.Should().BeGreaterThan(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }
}
