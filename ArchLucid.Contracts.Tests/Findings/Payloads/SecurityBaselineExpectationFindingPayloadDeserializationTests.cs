using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class SecurityBaselineExpectationFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_category_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "topologyNodeCount": 0,
              "securityNodeCount": 0,
              "expectedCategories": null,
              "protectedCategories": null,
              "missingCategories": null
            }
            """;

        SecurityBaselineExpectationFindingPayload? payload =
            JsonSerializer.Deserialize<SecurityBaselineExpectationFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.ExpectedCategories.Should().NotBeNull().And.BeEmpty();
        payload.ProtectedCategories.Should().NotBeNull().And.BeEmpty();
        payload.MissingCategories.Should().NotBeNull().And.BeEmpty();
    }
}
