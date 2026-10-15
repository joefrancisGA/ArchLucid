using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackContentValidationResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_issues_yields_empty_list_not_null()
    {
        const string json = """
            {
              "valid": true,
              "summary": {},
              "issues": null
            }
            """;

        PolicyPackContentValidationResponse response =
            JsonSerializer.Deserialize<PolicyPackContentValidationResponse>(json, ContractJson.Default)!;

        response.Issues.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_summary_yields_non_null_summary_not_null()
    {
        const string json = """
            {
              "valid": true,
              "summary": null,
              "issues": []
            }
            """;

        PolicyPackContentValidationResponse response =
            JsonSerializer.Deserialize<PolicyPackContentValidationResponse>(json, ContractJson.Default)!;

        response.Summary.Should().NotBeNull();
    }
}
