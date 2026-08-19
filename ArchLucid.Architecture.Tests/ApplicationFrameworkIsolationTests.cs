using System.Reflection;
using System.Xml.Linq;

using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     <c>ArchLucid.Application</c> orchestrates use cases via persistence ports; it must not reference SQL client
///     libraries directly so raw queries cannot bypass the hexagonal boundary.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApplicationFrameworkIsolationTests
{
    private static readonly string[] ForbiddenDataAccessNamespaces =
    [
        "Microsoft.Data.SqlClient",
        "System.Data.SqlClient",
        "Dapper",
        "RazorLight",
    ];

    [Fact]
    public void Application_must_not_reference_SqlClient_Dapper_or_RazorLight()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;

        TestResult result = Types
            .InAssembly(application)
            .ShouldNot()
            .HaveDependencyOnAny(ForbiddenDataAccessNamespaces)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Application depends on persistence ports and Core notification abstractions; "
                     + "Dapper, SqlClient, and RazorLight belong in adapter assemblies only. Offending types: {0}",
            ArchitectureConstraintFailureReport.FormatFailingTypeNames(result));
    }

    [Fact]
    public void Application_csproj_must_not_declare_Dapper_SqlClient_or_RazorLight_package_references()
    {
        string csprojPath = ArchitectureConstraintRepositoryPaths.ProjectFilePath("ArchLucid.Application");

        XDocument project = XDocument.Load(csprojPath);
        XNamespace msbuild = project.Root?.Name.Namespace ?? XNamespace.None;

        string[] forbiddenPackages = ["Dapper", "Microsoft.Data.SqlClient", "RazorLight"];
        List<string> declared = project
            .Descendants(msbuild + "PackageReference")
            .Select(element => element.Attribute("Include")?.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .ToList();

        declared.Intersect(forbiddenPackages, StringComparer.OrdinalIgnoreCase)
            .Should()
            .BeEmpty(
                because: "Application.csproj must not declare direct SQL or RazorLight package references; adapters live outside Application.");
    }

}
