using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ServiceNowCmdbCiApplTableApiTests
{
    [Fact]
    public void BuildLookupBySystemNameUri_targets_cmdb_ci_appl_and_encodes_name_query_from_system_name()
    {
        Uri instanceRoot = new("https://sn.example/acme/");
        Uri uri = ServiceNowCmdbCiApplTableApi.BuildLookupBySystemNameUri(instanceRoot, "Billing & Co");

        uri.AbsolutePath.Should().Be("/api/now/table/cmdb_ci_appl");

        uri.Query.Should().Contain("sysparm_limit=1");

        uri.Query.Should().Contain("sysparm_query=");
        uri.Query.Should().Contain("name=");

        string expectedEscapedNameSegment = Uri.EscapeDataString("Billing & Co");
        ServiceNowCmdbCiApplTableApi.BuildLookupQueryString("Billing & Co")
            .Should()
            .Contain(expectedEscapedNameSegment, because: "ServiceNow receives name= encoded via EscapeDataString");
    }

    [Fact]
    public void BuildCreateUri_targets_cmdb_ci_appl_POST_collection()
    {
        Uri instanceRoot = new("https://sn.example/");
        Uri uri = ServiceNowCmdbCiApplTableApi.BuildCreateUri(instanceRoot);

        uri.AbsolutePath.Should().Be("/api/now/table/cmdb_ci_appl");

        uri.Query.Should().BeEmpty();
    }
}
