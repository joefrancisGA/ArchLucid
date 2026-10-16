using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class TenantBrandingAdminContractsDeserializationTests
{
    [Fact]
    public void Deserialize_null_validation_issues_on_admin_state_yields_empty_list_not_null()
    {
        const string json = """
            {
              "validationIssues": null
            }
            """;

        TenantBrandingAdminStateResponse? state =
            JsonSerializer.Deserialize<TenantBrandingAdminStateResponse>(json, ContractJson.CamelCaseCompact);

        state.Should().NotBeNull();
        state!.ValidationIssues.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_validation_issues_on_activate_response_yields_empty_list_not_null()
    {
        const string json = """
            {
              "validationIssues": null
            }
            """;

        TenantBrandingActivateResponse? response =
            JsonSerializer.Deserialize<TenantBrandingActivateResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.ValidationIssues.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_admin_state_nested_objects_yields_non_null_defaults()
    {
        const string json = """
            {
              "draft": null,
              "active": null,
              "productDefaults": null
            }
            """;

        TenantBrandingAdminStateResponse? state =
            JsonSerializer.Deserialize<TenantBrandingAdminStateResponse>(json, ContractJson.CamelCaseCompact);

        state.Should().NotBeNull();
        state!.Draft.Should().NotBeNull();
        state.Active.Should().NotBeNull();
        state.ProductDefaults.Should().NotBeNull();
    }
}
