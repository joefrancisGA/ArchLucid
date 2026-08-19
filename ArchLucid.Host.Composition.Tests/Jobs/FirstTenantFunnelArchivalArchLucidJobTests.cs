using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Telemetry;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Jobs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FirstTenantFunnelArchivalArchLucidJobTests
{
    [Fact]
    public void Name_is_canonical_first_tenant_funnel_archival_slug()
    {
        Mock<IServiceScopeFactory> scopeFactory = new();
        Mock<IOptionsMonitor<FirstTenantFunnelOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new FirstTenantFunnelOptions { PerTenantEmission = false });

        FirstTenantFunnelArchivalArchLucidJob job = new(
            scopeFactory.Object,
            options.Object,
            NullLogger<FirstTenantFunnelArchivalArchLucidJob>.Instance);

        job.Name.Should().Be(ArchLucidJobNames.FirstTenantFunnelArchival);
    }

    [Fact]
    public async Task RunOnceAsync_returns_success_when_per_tenant_emission_off()
    {
        Mock<IFirstTenantFunnelArchivalBatchStore> store = new();
        store
            .Setup(s => s.TakeRowsOlderThanAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<FirstTenantFunnelArchiveRow>());

        ServiceCollection services = new();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddSingleton(store.Object);
        services.AddOptions<ArchLucidRetentionOptions>();

        await using ServiceProvider provider = services.BuildServiceProvider();

        Mock<IServiceScope> scope = new();
        scope.Setup(s => s.ServiceProvider).Returns(provider);
        scope.Setup(s => s.Dispose());

        Mock<IServiceScopeFactory> scopeFactory = new(MockBehavior.Strict);
        scopeFactory.Setup(f => f.CreateScope()).Returns(scope.Object);

        Mock<IOptionsMonitor<FirstTenantFunnelOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new FirstTenantFunnelOptions { PerTenantEmission = false });

        FirstTenantFunnelArchivalArchLucidJob job = new(
            scopeFactory.Object,
            options.Object,
            NullLogger<FirstTenantFunnelArchivalArchLucidJob>.Instance);

        int code = await job.RunOnceAsync(CancellationToken.None);

        code.Should().Be(ArchLucidJobExitCodes.Success);
        store.Verify(
            s => s.TakeRowsOlderThanAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }
}
