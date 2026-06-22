using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmNativeIntegrationGateTests
{
    [Fact]
    public void IsNativeCreateEnabled_returns_false_by_default()
    {
        ItsmNativeIntegrationGate sut = CreateGate(new IntegrationsItsmOptions());

        sut.IsNativeCreateEnabled().Should().BeFalse();
    }

    [Fact]
    public void IsNativeCreateEnabled_returns_true_when_configured()
    {
        ItsmNativeIntegrationGate sut = CreateGate(new IntegrationsItsmOptions { NativeEnabled = true });

        sut.IsNativeCreateEnabled().Should().BeTrue();
    }

    private static ItsmNativeIntegrationGate CreateGate(IntegrationsItsmOptions options)
    {
        Mock<IOptionsMonitor<IntegrationsItsmOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);

        return new ItsmNativeIntegrationGate(monitor.Object);
    }
}
