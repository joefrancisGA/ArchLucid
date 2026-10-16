using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminIdentityProviderDiagnosticsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_idp_probes_yields_non_null_defaults()
    {
        const string json = """
            {
              "oidc": null,
              "saml": null
            }
            """;

        AdminIdentityProviderDiagnosticsResponse? response =
            JsonSerializer.Deserialize<AdminIdentityProviderDiagnosticsResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Oidc.Should().NotBeNull();
        response.Saml.Should().NotBeNull();
    }
}
