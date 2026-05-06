using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Jobs;

using FluentAssertions;

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
        Mock<IServiceScopeFactory> scopeFactory = new(MockBehavior.Strict);
        Mock<IOptionsMonitor<FirstTenantFunnelOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new FirstTenantFunnelOptions { PerTenantEmission = false });

        FirstTenantFunnelArchivalArchLucidJob job = new(
            scopeFactory.Object,
            options.Object,
            NullLogger<FirstTenantFunnelArchivalArchLucidJob>.Instance);

        int code = await job.RunOnceAsync(CancellationToken.None);

        code.Should().Be(ArchLucidJobExitCodes.Success);
    }
}
