using System.Reflection;

using ArchLucid.Api.Auth.Scim;
using ArchLucid.Api.Middleware;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>Guards that host-only and persistence-implementation types stay non-public so cross-assembly callers depend on abstractions.</summary>
[Trait("Suite", "Architecture")]
[Trait("Category", "Unit")]
public sealed class InternalModifierBoundaryArchitectureTests
{
    [Fact]
    public void ArchLucid_Api_Middleware_types_are_not_public()
    {
        Assembly api = typeof(ApiDeprecationHeadersMiddleware).Assembly;
        List<string> violations = [];

        foreach (Type type in api.GetTypes())
        {
            if (type.Namespace != typeof(ApiDeprecationHeadersMiddleware).Namespace)
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
        Assembly api = typeof(ScimBearerAuthenticationHandler).Assembly;
        List<string> violations = [];

        foreach (Type type in api.GetTypes())
        {
            if (type.Namespace != typeof(ScimBearerAuthenticationHandler).Namespace)
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
        Type type = typeof(SqlMigrationPlanes);

        type.IsPublic.Should().BeFalse(
            $"{type.FullName} classifies embedded DbUp resources for ArchLucid.Persistence only; "
            + "other assemblies must not take a dependency on it.");
    }

    [Fact]
    public void ArchLucid_Persistence_HotPathRelationalQueryShapes_is_not_public()
    {
        Type type = typeof(HotPathRelationalQueryShapes);

        type.IsPublic.Should().BeFalse(
            $"{type.FullName} holds repository SQL text for ArchLucid.Persistence only; "
            + "expose behavior via repositories, not public string constants.");
    }
}
