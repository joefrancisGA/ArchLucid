using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.DecisionTraces;

[Trait("Category", "Unit")]
public sealed class RuleAuditTracePayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "appliedRuleIds": null,
              "acceptedFindingIds": null,
              "requiredFindingIds": null,
              "allowedFindingIds": null,
              "preferredFindingIds": null,
              "rejectedFindingIds": null,
              "notes": null,
              "warnings": null,
              "promptRefs": null
            }
            """;

        RuleAuditTracePayload? result =
            JsonSerializer.Deserialize<RuleAuditTracePayload>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.AppliedRuleIds.Should().NotBeNull().And.BeEmpty();
        result.AcceptedFindingIds.Should().NotBeNull().And.BeEmpty();
        result.RequiredFindingIds.Should().NotBeNull().And.BeEmpty();
        result.AllowedFindingIds.Should().NotBeNull().And.BeEmpty();
        result.PreferredFindingIds.Should().NotBeNull().And.BeEmpty();
        result.RejectedFindingIds.Should().NotBeNull().And.BeEmpty();
        result.Notes.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
        result.PromptRefs.Should().NotBeNull().And.BeEmpty();
    }
}
