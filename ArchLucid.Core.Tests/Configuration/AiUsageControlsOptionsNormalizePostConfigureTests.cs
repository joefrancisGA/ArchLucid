using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Configuration")]
public sealed class AiUsageControlsOptionsNormalizePostConfigureTests
{
    [Fact]
    public void PostConfigure_trims_public_demo_feature_daily_limit_usd_keys_from_configuration_binding()
    {
        AiUsageControlsOptions options = new()
        {
            PublicDemoFeatureDailyLimitUsd = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
            {
                ["  ArchitectureGeneration  "] = 0m,
            },
        };

        new AiUsageControlsOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.PublicDemoFeatureDailyLimitUsd.Should().ContainKey(AiUsageFeature.ArchitectureGeneration.ToString());
        options.PublicDemoFeatureDailyLimitUsd[AiUsageFeature.ArchitectureGeneration.ToString()].Should().Be(0m);
    }
}
