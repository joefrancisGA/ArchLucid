using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-005: operator-catalog keys that bypass or soften production guards must be wired into fail-fast lint.</summary>
[Trait("Suite", "Architecture")]
public sealed class ConfigurationCatalogProductionProfileGuardParityTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Catalog_entries_with_production_profile_guard_are_monitored_by_production_profile_fail_fast_lint()
    {
        IReadOnlySet<string> monitored = ProductionDangerousMisconfigurationLint.MonitoredConfigurationKeys;
        List<string> uncovered = [];

        foreach (ConfigurationKeyEntry entry in ConfigurationKeyCatalog.All)
        {
            if (entry.ProductionProfileGuardKind == ConfigurationKeyProductionProfileGuardKind.None)
                continue;

            if (!monitored.Contains(entry.ConfigPath))
                uncovered.Add($"{entry.ConfigPath} ({entry.ProductionProfileGuardKind})");
        }

        uncovered.Should()
            .BeEmpty(
                "every ConfigurationKeyCatalog row tagged DeveloperBypass/SoftGuard must appear in "
                + $"{nameof(ProductionProfileFailFastMonitoredConfigurationPaths.KeysConsultedByDescribeFailFastFindings)}. Missing: "
                + string.Join("; ", uncovered));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Monitored_fail_fast_keys_are_tagged_in_configuration_key_catalog()
    {
        Dictionary<string, ConfigurationKeyProductionProfileGuardKind> catalogByPath =
            ConfigurationKeyCatalog.All.ToDictionary(
                static entry => entry.ConfigPath,
                static entry => entry.ProductionProfileGuardKind,
                StringComparer.OrdinalIgnoreCase);

        List<string> untagged = [];

        foreach (string monitored in ProductionDangerousMisconfigurationLint.MonitoredConfigurationKeys)
        {
            if (!catalogByPath.TryGetValue(monitored, out ConfigurationKeyProductionProfileGuardKind guardKind)
                || guardKind == ConfigurationKeyProductionProfileGuardKind.None)
            {
                untagged.Add(monitored);
            }
        }

        untagged.Should()
            .BeEmpty(
                "every key consulted by production-profile fail-fast lint must be tagged in "
                + nameof(ConfigurationKeyCatalog)
                + " with DeveloperBypass or SoftGuard. Missing: "
                + string.Join("; ", untagged));
    }
}
