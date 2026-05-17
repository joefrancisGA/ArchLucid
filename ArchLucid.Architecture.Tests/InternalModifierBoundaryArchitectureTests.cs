using System.Reflection;

using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>Guards that host-only and persistence-implementation types stay non-public so cross-assembly callers depend on abstractions.</summary>
[Trait("Suite", "Architecture")]
[Trait("Category", "Unit")]
public sealed class InternalModifierBoundaryArchitectureTests
{
    private const string ApiMiddlewareNamespace = "ArchLucid.Api.Middleware";
    private const string ApiScimAuthNamespace = "ArchLucid.Api.Auth.Scim";

    [Fact]
    public void ArchLucid_Api_Middleware_types_are_not_public()
    {
        Assembly api = typeof(ManifestsController).Assembly;
        List<string> violations = [];

        foreach (Type type in api.GetTypes())
        {
            if (type.Namespace != ApiMiddlewareNamespace)
                continue;

            if (type.IsPublic)
                violations.Add(type.FullName ?? type.Name);
        }

        violations.Should().BeEmpty(
            "ASP.NET middleware is composed only inside ArchLucid.Api; keep it internal so the host assembly's public surface stays HTTP + startup contracts. "
            + string.Join("; ", violations));
    }

    [Fact]
    public void ArchLucid_Api_Scim_authentication_types_are_not_public()
    {
        Assembly api = typeof(ManifestsController).Assembly;
        List<string> violations = [];

        foreach (Type type in api.GetTypes())
        {
            if (type.Namespace != ApiScimAuthNamespace)
                continue;

            if (type.IsPublic)
                violations.Add(type.FullName ?? type.Name);
        }

        violations.Should().BeEmpty(
            "SCIM bearer authentication is wired only via AuthServiceCollectionExtensions in ArchLucid.Api. "
            + string.Join("; ", violations));
    }

    [Fact]
    public void ArchLucid_Persistence_SqlMigrationPlanes_is_not_public()
    {
        Assembly persistence = typeof(ISchemaBootstrapper).Assembly;
        Type? type = persistence.GetType("ArchLucid.Persistence.Data.Infrastructure.SqlMigrationPlanes", throwOnError: false, ignoreCase: false);

        type.Should().NotBeNull("SqlMigrationPlanes must remain in ArchLucid.Persistence");
        type!.IsPublic.Should().BeFalse(
            $"{type.FullName} classifies embedded DbUp resources for ArchLucid.Persistence only; "
            + "other assemblies must not take a dependency on it.");
    }

    [Fact]
    public void ArchLucid_Persistence_HotPathRelationalQueryShapes_is_not_public()
    {
        Assembly persistence = typeof(ISchemaBootstrapper).Assembly;
        Type? type = persistence.GetType("ArchLucid.Persistence.Sql.HotPathRelationalQueryShapes", throwOnError: false, ignoreCase: false);

        type.Should().NotBeNull("HotPathRelationalQueryShapes must remain in ArchLucid.Persistence");
        type!.IsPublic.Should().BeFalse(
            $"{type.FullName} holds repository SQL text for ArchLucid.Persistence only; "
            + "expose behavior via repositories, not public string constants.");
    }
}
