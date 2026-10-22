using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackGovernanceDryRunResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "resolvedRunId": "run-1",
              "targetManifestId": null,
              "gateResult": { "blocked": false },
              "passedChecks": null,
              "failedChecks": null,
              "warnings": null
            }
            """;

        PolicyPackGovernanceDryRunResult result =
            JsonSerializer.Deserialize<PolicyPackGovernanceDryRunResult>(json, ContractJson.Default)!;

        result.PassedChecks.Should().NotBeNull().And.BeEmpty();
        result.FailedChecks.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
