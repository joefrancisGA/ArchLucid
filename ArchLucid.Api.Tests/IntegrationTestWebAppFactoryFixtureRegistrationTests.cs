using System.Reflection;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Guards xUnit fixture wiring: integration tests that take a <see cref="WebApplicationFactory{TEntryPoint}" />
///     (or derivative) in their constructor must declare <see cref="IClassFixture{T}" /> for that type so the host is
///     shared for the class lifetime (CI #2268 / missing <c>IClassFixture</c> caused null <see cref="HttpClient.BaseAddress" />).
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestWebAppFactoryFixtureRegistrationTests
{
    private static readonly Assembly ApiTestsAssembly = typeof(IntegrationTestWebAppFactoryFixtureRegistrationTests).Assembly;

    [Fact]
    public void Test_classes_with_web_app_factory_constructor_implement_matching_IClassFixture()
    {
        List<string> violations = [];

        foreach (Type type in ApiTestsAssembly.GetTypes())
        {
            if (type.IsAbstract || type.IsInterface || type.IsNestedPrivate)
                continue;

            if (!DeclaresTestMethod(type))
                continue;

            Type? factoryType = TryGetWebAppFactoryConstructorParameter(type);

            if (factoryType is null)
                continue;

            if (ImplementsIClassFixture(type, factoryType))
                continue;

            violations.Add(
                $"{type.FullName}: constructor parameter `{factoryType.Name}` requires `IClassFixture<{factoryType.Name}>` on the test class (or a base type).");
        }

        violations.Should().BeEmpty();
    }

    private static bool DeclaresTestMethod(Type type)
    {
        return type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Any(static method =>
                method.GetCustomAttributes(inherit: true)
                    .Any(static attribute =>
            {
                string name = attribute.GetType().Name;

                return name is "FactAttribute" or "TheoryAttribute" or "SkippableFactAttribute"
                    or "SkippableTheoryAttribute";
            }));
    }

    private static Type? TryGetWebAppFactoryConstructorParameter(Type type)
    {
        foreach (ConstructorInfo ctor in type.GetConstructors(BindingFlags.Public | BindingFlags.Instance))
        {
            ParameterInfo[] parameters = ctor.GetParameters();

            if (parameters.Length != 1)
                continue;

            Type parameterType = parameters[0].ParameterType;

            if (IsWebApplicationFactoryType(parameterType))
                return parameterType;
        }

        return null;
    }

    private static bool IsWebApplicationFactoryType(Type type)
    {
        for (Type? current = type; current is not null; current = current.BaseType)
        {
            if (!current.IsGenericType)
                continue;

            if (current.GetGenericTypeDefinition() == typeof(WebApplicationFactory<>))
                return true;
        }

        return false;
    }

    private static bool ImplementsIClassFixture(Type type, Type factoryType)
    {
        Type fixtureInterface = typeof(IClassFixture<>).MakeGenericType(factoryType);

        for (Type? current = type; current is not null; current = current.BaseType)
        {
            if (current.GetInterfaces().Contains(fixtureInterface))
                return true;
        }

        return false;
    }
}
