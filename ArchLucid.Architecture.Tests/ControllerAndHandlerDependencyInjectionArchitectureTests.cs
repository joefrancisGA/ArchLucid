using ArchLucid.Architecture.Tests.DependencyInjection;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Assessment improvement 7 — MVC controllers and auth pipeline handlers must only constructor-inject interfaces that
///     are registered in the composed API <see cref="IServiceCollection" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ControllerAndHandlerDependencyInjectionArchitectureTests
{
    [Fact]
    public void ArchLucid_Api_controllers_and_handlers_only_inject_registered_interfaces()
    {
        IReadOnlyList<Type> hostTypes = ApiHostControllerAndHandlerDiscovery.DiscoverControllerAndHandlerTypes();

        hostTypes.Should().NotBeEmpty("NetArchTest must find at least one ControllerBase type in ArchLucid.Api");

        ServiceCollection services = ApiSimulatorCompositionServiceCollectionBuilder.Build();
        List<string> unregistered = [];

        foreach (Type hostType in hostTypes)
        {
            foreach (ConstructorInterfaceDependency dependency in InjectableInterfaceConstructorParameterCollector.CollectFromType(hostType))
            {
                if (DiServiceCollectionRegistrationProbe.IsRegistered(services, dependency.InterfaceType))
                    continue;

                unregistered.Add(
                    $"{dependency.HostType.FullName} requires {dependency.InterfaceType.FullName} ({dependency.ParameterName})");
            }
        }

        unregistered.Should().BeEmpty(
            "every interface injected into ArchLucid.Api controllers and auth handlers must be registered in the composed DI container. "
            + "Unregistered:{0}{1}",
            Environment.NewLine,
            string.Join(Environment.NewLine, unregistered));
    }

    [Fact]
    public void ArchLucid_Api_composed_service_provider_resolves_every_controller_and_handler_type()
    {
        IReadOnlyList<Type> hostTypes = ApiHostControllerAndHandlerDiscovery.DiscoverControllerAndHandlerTypes();

        ServiceCollection services = ApiSimulatorCompositionServiceCollectionBuilder.Build();

        using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });

        foreach (Type hostType in hostTypes)
        {
            object instance = provider.GetRequiredService(hostType);
            instance.Should().NotBeNull();
        }
    }

}
