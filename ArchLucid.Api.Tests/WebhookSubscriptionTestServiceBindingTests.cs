using System.Reflection;

using ArchLucid.Api.Services;
using ArchLucid.Application.Integrations;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WebhookSubscriptionTestServiceBindingTests
{
    [Fact]
    public void Primary_constructor_probe_parameter_uses_application_integrations_outbound_probe()
    {
        ParameterInfo probeParameter = typeof(WebhookSubscriptionTestService)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .Single()
            .GetParameters()
            .Single(static parameter => parameter.Name == "probe");

        probeParameter.ParameterType.Should().Be(
            typeof(IOutboundWebhookDryRunService),
            "Api.Services types must not shadow Application.Integrations.IOutboundWebhookDryRunService " +
            "or DI cannot resolve the Host.Composition HttpClient registration");
    }
}
