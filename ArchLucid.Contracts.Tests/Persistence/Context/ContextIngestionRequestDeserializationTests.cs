using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Context;

[Trait("Category", "Unit")]
public sealed class ContextIngestionRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "inlineRequirements": null,
              "documents": null,
              "policyReferences": null,
              "topologyHints": null,
              "securityBaselineHints": null,
              "infrastructureDeclarations": null,
              "requiredCapabilities": null,
              "constraints": null,
              "assumptions": null
            }
            """;

        ContextIngestionRequest? result =
            JsonSerializer.Deserialize<ContextIngestionRequest>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.InlineRequirements.Should().NotBeNull().And.BeEmpty();
        result.Documents.Should().NotBeNull().And.BeEmpty();
        result.PolicyReferences.Should().NotBeNull().And.BeEmpty();
        result.TopologyHints.Should().NotBeNull().And.BeEmpty();
        result.SecurityBaselineHints.Should().NotBeNull().And.BeEmpty();
        result.InfrastructureDeclarations.Should().NotBeNull().And.BeEmpty();
        result.RequiredCapabilities.Should().NotBeNull().And.BeEmpty();
        result.Constraints.Should().NotBeNull().And.BeEmpty();
        result.Assumptions.Should().NotBeNull().And.BeEmpty();
    }
}
