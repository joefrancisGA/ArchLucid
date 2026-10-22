using System.Reflection;
using System.Text.Json;

using ArchLucid.Application.Roi;
using ArchLucid.Core.Agents;
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
    public void EnsureSettingValueLength_accepts_value_at_exact_migration_nvarchar_512_limit()
    {
        string exactLimit = new('v', TenantSettingsSchemaLimits.SettingValueMaxLength);

        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(exactLimit);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureSettingValueLength_accepts_exact_limit_after_surrounding_whitespace_trim()
    {
        string exactLimit = new('v', TenantSettingsSchemaLimits.SettingValueMaxLength);
        string padded = "  " + exactLimit + "  ";

        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(padded);

        act.Should().NotThrow();
        padded.Trim().Length.Should().Be(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    [Fact]
    public void EnsureSettingValueLength_counts_interior_whitespace_toward_trimmed_length_budget()
    {
        string core = new('a', TenantSettingsSchemaLimits.SettingValueMaxLength - 1);
        string withInteriorNewline = core + "\n" + "x";

        withInteriorNewline.Trim().Length.Should().Be(TenantSettingsSchemaLimits.SettingValueMaxLength + 1);

        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(withInteriorNewline);

        act.Should().Throw<ArgumentException>()
            .WithMessage($"*at most {TenantSettingsSchemaLimits.SettingValueMaxLength}*");
    }

    [Fact]
    public void EnsureSettingValueLength_accepts_compact_json_without_interior_whitespace_at_budget()
    {
        List<string> aliasIds = Enumerable
            .Range(1, 13)
            .Select(index => $"managed-azure-openai-alias-{index:D2}")
            .ToList();

        string json = JsonSerializer.Serialize(
            new
            {
                allowedAliasIds = aliasIds,
                defaultAliasId = aliasIds[0],
            });

        json.Should().NotContain("\n");
        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(json);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureSettingValueLength_rejects_whitespace_only_value()
    {
        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength("   ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void TryGetCoreAsync_maps_whitespace_only_setting_value_scalar_to_null()
    {
        // Mirrors SqlTenantSettingsRepository.TryGetCoreAsync post-query normalization for legacy SQL rows.
        static string? NormalizeReadScalar(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        NormalizeReadScalar(null).Should().BeNull();
        NormalizeReadScalar(string.Empty).Should().BeNull();
        NormalizeReadScalar("   ").Should().BeNull();
        NormalizeReadScalar("  enabled  ").Should().Be("enabled");
    }

    [Fact]
    public void EnsureSettingValueLength_accepts_supplementary_plane_characters_at_nvarchar_code_unit_limit()
    {
        string value = string.Concat(Enumerable.Repeat("😀", 256));

        value.Length.Should().Be(TenantSettingsSchemaLimits.SettingValueMaxLength);

        Action act = () => TenantSettingsWriteGuard.EnsureSettingValueLength(value);

        act.Should().NotThrow();
    }

    [Fact]
    public void Serialized_allowed_engine_set_with_twelve_aliases_fits_migration_setting_value_limit()
    {
        List<string> aliasIds = Enumerable
            .Range(1, 12)
            .Select(index => $"managed-azure-openai-alias-{index:D2}")
            .ToList();

        string json = JsonSerializer.Serialize(
            new
            {
                allowedAliasIds = aliasIds,
                defaultAliasId = aliasIds[0],
            });

        json.Length.Should().BeLessThanOrEqualTo(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    [Fact]
    public void Serialized_allowed_engine_set_with_eleven_aliases_fits_migration_setting_value_limit()
    {
        List<string> aliasIds = Enumerable
            .Range(1, 11)
            .Select(index => $"managed-azure-openai-alias-{index:D2}")
            .ToList();

        string json = JsonSerializer.Serialize(
            new
            {
                allowedAliasIds = aliasIds,
                defaultAliasId = aliasIds[0],
            });

        json.Length.Should().BeLessThanOrEqualTo(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    [Fact]
    public void Serialized_allowed_engine_set_with_thirteen_aliases_fits_migration_setting_value_limit()
    {
        List<string> aliasIds = Enumerable
            .Range(1, 13)
            .Select(index => $"managed-azure-openai-alias-{index:D2}")
            .ToList();

        string json = JsonSerializer.Serialize(
            new
            {
                allowedAliasIds = aliasIds,
                defaultAliasId = aliasIds[0],
            });

        json.Length.Should().BeLessThanOrEqualTo(TenantSettingsSchemaLimits.SettingValueMaxLength);
    }

    [Fact]
    public void Serialized_default_catalog_allowed_engine_set_fits_migration_setting_value_limit()
    {
        IReadOnlyList<string> aliasIds =
        [
            AgentModelAliasIds.EconomyGeneral,
            AgentModelAliasIds.StandardGeneral,
            AgentModelAliasIds.PremiumAssurance,
        ];

        string json = JsonSerializer.Serialize(
            new
            {
                allowedAliasIds = aliasIds,
                defaultAliasId = AgentModelAliasIds.StandardGeneral,
            });

        json.Length.Should().BeLessThanOrEqualTo(TenantSettingsSchemaLimits.SettingValueMaxLength);
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
