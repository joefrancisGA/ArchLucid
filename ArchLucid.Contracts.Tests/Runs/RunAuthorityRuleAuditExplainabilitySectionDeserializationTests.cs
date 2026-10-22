using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunAuthorityRuleAuditExplainabilitySectionDeserializationTests
{
    [Fact]
    public void Deserialize_null_audit_lists_yields_empty_lists_not_null()
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
              "promptRefs": null
            }
            """;

        RunAuthorityRuleAuditExplainabilitySection? section =
            JsonSerializer.Deserialize<RunAuthorityRuleAuditExplainabilitySection>(json, ContractJson.CamelCaseCompact);

        section.Should().NotBeNull();
        section!.AppliedRuleIds.Should().NotBeNull().And.BeEmpty();
        section.AcceptedFindingIds.Should().NotBeNull().And.BeEmpty();
        section.RequiredFindingIds.Should().NotBeNull().And.BeEmpty();
        section.AllowedFindingIds.Should().NotBeNull().And.BeEmpty();
        section.PreferredFindingIds.Should().NotBeNull().And.BeEmpty();
        section.RejectedFindingIds.Should().NotBeNull().And.BeEmpty();
        section.Notes.Should().NotBeNull().And.BeEmpty();
        section.PromptRefs.Should().NotBeNull().And.BeEmpty();
    }
}
