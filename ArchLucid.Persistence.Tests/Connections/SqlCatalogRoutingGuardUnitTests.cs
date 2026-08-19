using ArchLucid.Persistence.Connections;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlCatalogRoutingGuardUnitTests
{
    [Theory]
    [InlineData(
        "Server=localhost;Database=ArchLucidSystem;Encrypt=True",
        "Server=localhost;Database=ArchLucidSystem;Encrypt=True",
        true)]
    [InlineData(
        "Server=localhost;Database=ArchLucidTenantA;Encrypt=True",
        "Server=localhost;Database=ArchLucidSystem;Encrypt=True",
        false)]
    public void TargetsSameCatalog_compares_initial_catalog_case_insensitively(
        string leftConnectionString,
        string rightConnectionString,
        bool expected)
    {
        SqlCatalogRoutingGuard.TargetsSameCatalog(leftConnectionString, rightConnectionString)
            .Should()
            .Be(expected);
    }
}
