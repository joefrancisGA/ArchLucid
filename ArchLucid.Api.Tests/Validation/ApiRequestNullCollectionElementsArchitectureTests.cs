using System.Collections;
using System.Reflection;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Http;
using ArchLucid.Api.Startup;
using ArchLucid.Api.Validation;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ApiRequestNullCollectionElementsArchitectureTests
{
    [Fact]
    public void Mvc_registers_null_collection_elements_filter()
    {
        string repoRoot = FindRepositoryRoot();
        string mvcExtensionsPath = Path.Combine(repoRoot, "ArchLucid.Api", "Startup", "MvcExtensions.cs");

        File.Exists(mvcExtensionsPath).Should().BeTrue(mvcExtensionsPath);
        string source = File.ReadAllText(mvcExtensionsPath);
        source.Should().Contain("options.Filters.Add<ApiRequestNullCollectionElementsFilter>");
    }

    private static string FindRepositoryRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null)
        {

            string gitPath = Path.Combine(directory.FullName, ".git");

            if (Directory.Exists(gitPath) || File.Exists(gitPath))
                return directory.FullName;

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Repository root not found from test base directory.");
    }

    [Fact]
    public void All_from_body_request_collection_properties_are_rejected_when_probe_contains_null_element()
    {
        Assembly apiAssembly = typeof(RunCoverageController).Assembly;
        IReadOnlyList<Type> requestTypes = ApiRequestBodyTypeCatalog.DiscoverFromBodyRequestTypes(apiAssembly);

        requestTypes.Should().NotBeEmpty();

        List<string> skipped = [];

        foreach (Type requestType in requestTypes)
        {
            foreach ((Type _, string propertyPath, PropertyInfo _) in ApiRequestBodyTypeCatalog.EnumerateCollectionPropertyPaths(
                         requestType))
            {
                object? probe = ApiRequestNullCollectionProbeFactory.TryCreateWithNullCollectionElement(requestType, propertyPath);

                if (probe is null)
                {
                    skipped.Add($"{requestType.Name}.{propertyPath}");

                    continue;
                }

                ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(probe)
                    .Should()
                    .BeTrue($"probe for {requestType.Name}.{propertyPath} must trip the guard");
            }
        }

        skipped.Count.Should().BeLessThan(25, "unexpected number of collection probes could not be constructed: " + string.Join(", ", skipped));
    }

    [Fact]
    public void All_root_from_body_enumerable_parameters_reject_null_elements()
    {
        Assembly apiAssembly = typeof(RunCoverageController).Assembly;

        foreach (Type controllerType in apiAssembly.GetTypes())
        {

            if (!typeof(Microsoft.AspNetCore.Mvc.ControllerBase).IsAssignableFrom(controllerType) || controllerType.IsAbstract)
                continue;

            foreach (MethodInfo method in controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            {

                foreach (ParameterInfo parameter in method.GetParameters())
                {

                    if (parameter.GetCustomAttribute<Microsoft.AspNetCore.Mvc.FromBodyAttribute>() is null)
                        continue;

                    Type parameterType = Nullable.GetUnderlyingType(parameter.ParameterType) ?? parameter.ParameterType;

                    if (parameterType == typeof(CancellationToken))
                        continue;

                    if (!typeof(IEnumerable).IsAssignableFrom(parameterType)
                        || parameterType == typeof(string)
                        || parameterType == typeof(byte[]))
                    {
                        continue;
                    }

                    Type? elementType = parameterType
                        .GetInterfaces()
                        .Concat([parameterType])
                        .FirstOrDefault(static type =>
                            type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IEnumerable<>))
                        ?.GetGenericArguments()[0];

                    if (elementType is null || elementType.IsValueType)
                        continue;

                    IList list = (IList)Activator.CreateInstance(typeof(List<>).MakeGenericType(elementType))!;
                    list.Add(null);

                    ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(list, parameter)
                        .Should()
                        .BeTrue($"null element in root body enumerable {controllerType.Name}.{method.Name} must trip the guard");
                }
            }
        }
    }

    [Fact]
    public void All_from_body_non_nullable_collection_properties_are_rejected_when_property_is_null()
    {
        Assembly apiAssembly = typeof(RunCoverageController).Assembly;
        IReadOnlyList<Type> requestTypes = ApiRequestBodyTypeCatalog.DiscoverFromBodyRequestTypes(apiAssembly);

        requestTypes.Should().NotBeEmpty();

        List<string> skipped = [];
        List<string> proven = [];

        foreach (Type requestType in requestTypes)
        {
            foreach ((Type _, string propertyPath, PropertyInfo property) in ApiRequestBodyTypeCatalog.EnumerateCollectionPropertyPaths(
                         requestType))
            {

                if (ApiRequestBodyTypeCatalog.CollectionPropertyAllowsNull(property))
                    continue;

                object? probe = ApiRequestNullCollectionProbeFactory.TryCreateWithNullCollectionProperty(requestType, propertyPath);

                if (probe is null)
                {
                    skipped.Add($"{requestType.Name}.{propertyPath}");

                    continue;
                }

                ApiRequestNullCollectionElementsGuard.ContainsNullCollectionElement(probe)
                    .Should()
                    .BeTrue($"null collection property probe for {requestType.Name}.{propertyPath} must trip the guard");

                proven.Add($"{requestType.Name}.{propertyPath}");
            }
        }

        proven.Should().NotBeEmpty("at least one non-nullable collection property must be probeable for null");
        skipped.Count.Should().BeLessThan(120, "unexpected number of null-property probes could not be constructed: " + string.Join(", ", skipped));
    }
}
