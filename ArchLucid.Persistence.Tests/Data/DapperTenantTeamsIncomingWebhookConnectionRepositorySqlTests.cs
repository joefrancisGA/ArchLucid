using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class DapperTenantTeamsIncomingWebhookConnectionRepositorySqlTests
{
    [Fact]
    public void Upsert_merge_holds_the_tenant_key_range_until_the_statement_completes()
    {
        string source = ReadRepositorySource();

        source.Should().Contain(
            "MERGE dbo.TenantTeamsIncomingWebhookConnections WITH (HOLDLOCK) AS t",
            "concurrent first-time upserts must not both choose the INSERT branch for the tenant primary key");
    }

    private static string ReadRepositorySource()
    {
        string path = Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "ArchLucid.Persistence",
            "Data",
            "Repositories",
            "DapperTenantTeamsIncomingWebhookConnectionRepository.cs");

        return File.ReadAllText(Path.GetFullPath(path));
    }
}
