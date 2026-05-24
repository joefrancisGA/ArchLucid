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
    ];

    [Fact]
    public void Application_must_not_reference_SqlClient_or_Dapper()
    {
        Assembly application = typeof(ArchitectureRunCreateOrchestrator).Assembly;

        TestResult result = Types
            .InAssembly(application)
            .ShouldNot()
            .HaveDependencyOnAny(ForbiddenDataAccessNamespaces)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            because: "Application depends on persistence ports (ArchLucid.Persistence.Interfaces/Models in Core); "
                     + "Dapper and SqlClient belong in ArchLucid.Persistence adapters only. Offending types: {0}",
            FormatFailingTypeNames(result));
    }

    [Fact]
    public void Application_csproj_must_not_declare_Dapper_or_SqlClient_package_references()
    {
        string csprojPath = Path.Combine(
            FindRepositoryRoot(),
            "ArchLucid.Application",
            "ArchLucid.Application.csproj");

        XDocument project = XDocument.Load(csprojPath);
        XNamespace msbuild = project.Root?.Name.Namespace ?? XNamespace.None;

        string[] forbiddenPackages = ["Dapper", "Microsoft.Data.SqlClient"];
        List<string> declared = project
            .Descendants(msbuild + "PackageReference")
            .Select(element => element.Attribute("Include")?.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .ToList();

        declared.Intersect(forbiddenPackages, StringComparer.OrdinalIgnoreCase)
            .Should()
            .BeEmpty(
                because: "Application.csproj must not declare direct SQL package references; persistence adapters live in ArchLucid.Persistence.");
    }

    private static string FindRepositoryRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root containing ArchLucid.sln.");
    }

    private static string FormatFailingTypeNames(TestResult result)
    {
        IReadOnlyList<string>? names = result.FailingTypeNames;

        if (names is null || names.Count == 0)
            return "(none reported)";

        return string.Join(", ", names);
    }
}
