using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminContractListDeserializationTests
{
    [Fact]
    public void Deserialize_null_invitations_yields_empty_list_not_null()
    {
        const string json = """
            {
              "invitations": null
            }
            """;

        UserInvitationListResponse? result =
            JsonSerializer.Deserialize<UserInvitationListResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Invitations.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_tenant_health_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        AdminTenantHealthListResponse? result =
            JsonSerializer.Deserialize<AdminTenantHealthListResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_rag_corpora_yields_empty_list_not_null()
    {
        const string json = """
            {
              "corpora": null
            }
            """;

        AdminRagHealthResponse? result =
            JsonSerializer.Deserialize<AdminRagHealthResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Corpora.Should().NotBeNull().And.BeEmpty();
    }
}
