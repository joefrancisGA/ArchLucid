using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryNeverShowSqlDatabaseNamesTests
{
    [Theory]
    [InlineData(
        "Microsoft.Sql/servers/databases",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/master")]
    [InlineData(
        "Microsoft.Sql/managedInstances/databases",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/managedInstances/mi-prod/databases/master")]
    [InlineData(
        null,
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/master",
        "master")]
    public void ShouldOmit_returns_true_for_sql_server_master_database(
        string? resourceType,
        string azureResourceId,
        string? resourceName = null)
    {
        AzureInventoryNeverShowSqlDatabaseNames.ShouldOmit(resourceType, azureResourceId, resourceName)
            .Should()
            .BeTrue();
    }

    [Theory]
    [InlineData(
        "Microsoft.Sql/servers/databases",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/appdb")]
    [InlineData(
        "Microsoft.Sql/managedInstances/databases",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/managedInstances/mi-prod/databases/payments")]
    [InlineData("Microsoft.Storage/storageAccounts", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1")]
    public void ShouldOmit_returns_false_for_visible_databases_and_non_sql_resources(
        string resourceType,
        string azureResourceId)
    {
        AzureInventoryNeverShowSqlDatabaseNames.ShouldOmit(resourceType, azureResourceId)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldOmitResource_omits_sql_master_database_resources()
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                "Microsoft.Sql/servers/databases",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/master")
            .Should()
            .BeTrue();

        AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                "Microsoft.Sql/servers/databases",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/appdb")
            .Should()
            .BeFalse();
    }
}
