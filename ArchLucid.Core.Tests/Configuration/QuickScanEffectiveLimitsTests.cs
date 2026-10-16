using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class QuickScanEffectiveLimitsTests
{
    [Fact]
    public void Merge_leaves_identity_limits_on_options_when_safety_enabled_because_identity_abuse_reads_safety_identity()
    {
        QuickScanOptions options = new()
        {
            MaxScansPerIpPerHour = 100,
            MaxScansPerSessionPerDay = 50,
        };

        QuickScanSafetyOptions safety = new()
        {
            Enabled = true,
            Identity = new QuickScanSafetyIdentityLimits
            {
                MaxScansPerIpPerHour = 2,
                MaxScansPerSessionPerDay = 3,
            },
        };

        QuickScanOptions merged = QuickScanEffectiveLimits.Merge(options, safety);

        merged.MaxScansPerIpPerHour.Should().Be(100);
        merged.MaxScansPerSessionPerDay.Should().Be(50);
    }
}
