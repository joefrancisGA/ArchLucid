using ArchLucid.Application.Configuration;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Configuration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGateOptionsResolverTests
{
    [Fact]
    public void Resolve_without_tenant_scope_returns_host_mode()
    {
        AgentOutputQualityGateOptions host = new() { Mode = AgentOutputQualityGateMode.PilotStrict };
        AgentOutputQualityGateOptionsResolver resolver = CreateResolver(host, tenantId: Guid.Empty, storedMode: "WarnOnly");

        AgentOutputQualityGateOptions effective = resolver.Resolve();

        effective.Mode.Should().Be(AgentOutputQualityGateMode.PilotStrict);
    }

    [Fact]
    public void Resolve_with_tenant_override_applies_stored_mode()
    {
        AgentOutputQualityGateOptions host = new() { Mode = AgentOutputQualityGateMode.WarnOnly };
        AgentOutputQualityGateOptionsResolver resolver = CreateResolver(
            host,
            tenantId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            storedMode: "PilotStrict");

        AgentOutputQualityGateOptions effective = resolver.Resolve();

        effective.Mode.Should().Be(AgentOutputQualityGateMode.PilotStrict);
    }

    private static AgentOutputQualityGateOptionsResolver CreateResolver(
        AgentOutputQualityGateOptions host,
        Guid tenantId,
        string? storedMode)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantSettingsRepository> settings = new();
        settings
            .Setup(r => r.TryGetAsync(tenantId, TenantSettingKeys.AgentOutputQualityGateMode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(storedMode);

        return new AgentOutputQualityGateOptionsResolver(Options.Create(host), scope.Object, settings.Object);
    }
}
