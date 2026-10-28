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
