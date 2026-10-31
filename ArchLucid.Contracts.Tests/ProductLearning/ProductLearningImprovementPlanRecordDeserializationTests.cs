using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningImprovementPlanRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_action_steps_yields_empty_list_not_null()
    {
        const string json = """
            {
              "planId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "workspaceId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "projectId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "themeId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              "title": "Reduce triage friction",
              "summary": "Follow-on from theme",
              "actionSteps": null,
              "priorityScore": 10,
              "status": "Proposed",
              "createdUtc": "2026-10-29T12:00:00Z"
            }
            """;

        ProductLearningImprovementPlanRecord? record =
            JsonSerializer.Deserialize<ProductLearningImprovementPlanRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.ActionSteps.Should().NotBeNull().And.BeEmpty();
    }
}
