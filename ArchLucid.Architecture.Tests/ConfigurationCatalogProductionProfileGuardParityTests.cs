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
}
