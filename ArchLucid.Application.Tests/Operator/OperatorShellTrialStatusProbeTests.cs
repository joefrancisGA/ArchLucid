using ArchLucid.Application.Operator.Probes;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

namespace ArchLucid.Application.Tests.Operator;

[Trait("Suite", "Application")]
public sealed class OperatorShellTrialStatusProbeTests
{
    [Fact]
    public async Task ProbeAsync_maps_none_status()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, TrialRunsUsed = 2 });

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        OperatorShellTrialStatusProbe probe = new(tenants.Object, options.Object);

        OperatorShellStatusBuilder builder = new()
        {
            Scope = new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
        };

        await probe.ProbeAsync(builder, CancellationToken.None);
        builder.TrialStatus!.Status.Should().Be("None");
    }
}
