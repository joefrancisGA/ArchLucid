using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class ControllerReadPathWarmupOptionsTests
{
    [SkippableFact]
    public void GetEffectiveRequestTimeout_clamps_to_5_through_55_seconds()
    {
        ControllerReadPathWarmupOptions options = new() { RequestTimeoutSeconds = 999 };

        options.GetEffectiveRequestTimeout().Should().Be(TimeSpan.FromSeconds(55));

        options.RequestTimeoutSeconds = 1;
        options.GetEffectiveRequestTimeout().Should().Be(TimeSpan.FromSeconds(5));
    }
}
