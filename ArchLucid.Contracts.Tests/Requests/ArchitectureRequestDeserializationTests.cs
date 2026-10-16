using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class ArchitectureRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "description": "abcdefghijklmnopqrst",
              "systemName": "Sys",
              "environment": "prod",
              "cloudProvider": 0,
              "constraints": null,
              "requiredCapabilities": null,
              "assumptions": null,
              "draftActors": null,
              "inlineRequirements": null,
              "documents": null,
              "policyReferences": null,
              "topologyHints": null,
              "securityBaselineHints": null,
              "infrastructureDeclarations": null
            }
            """;

        ArchitectureRequest? result =
            JsonSerializer.Deserialize<ArchitectureRequest>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Constraints.Should().NotBeNull().And.BeEmpty();
        result.RequiredCapabilities.Should().NotBeNull().And.BeEmpty();
        result.Assumptions.Should().NotBeNull().And.BeEmpty();
        result.DraftActors.Should().NotBeNull().And.BeEmpty();
        result.InlineRequirements.Should().NotBeNull().And.BeEmpty();
        result.Documents.Should().NotBeNull().And.BeEmpty();
        result.PolicyReferences.Should().NotBeNull().And.BeEmpty();
        result.TopologyHints.Should().NotBeNull().And.BeEmpty();
        result.SecurityBaselineHints.Should().NotBeNull().And.BeEmpty();
        result.InfrastructureDeclarations.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_intake_question_answers_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "description": "abcdefghijklmnopqrst",
              "systemName": "Sys",
              "environment": "prod",
              "cloudProvider": 0,
              "intakeQuestionAnswers": null
            }
            """;

        ArchitectureRequest? result =
            JsonSerializer.Deserialize<ArchitectureRequest>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.IntakeQuestionAnswers.Should().NotBeNull().And.BeEmpty();
    }
}
