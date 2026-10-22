using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class ArchitectureDraftStructuredBriefDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "confirmedConstraints": null,
              "confirmedAssumptions": null,
              "confirmedRequiredCapabilities": null,
              "confirmedInlineRequirements": null,
              "suggestedConstraints": null,
              "suggestedAssumptions": null,
              "suggestedRequiredCapabilities": null,
              "deniedConstraints": null,
              "deniedAssumptions": null,
              "deniedRequiredCapabilities": null
            }
            """;

        ArchitectureDraftStructuredBrief? result =
            JsonSerializer.Deserialize<ArchitectureDraftStructuredBrief>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ConfirmedConstraints.Should().NotBeNull().And.BeEmpty();
        result.ConfirmedAssumptions.Should().NotBeNull().And.BeEmpty();
        result.ConfirmedRequiredCapabilities.Should().NotBeNull().And.BeEmpty();
        result.ConfirmedInlineRequirements.Should().NotBeNull().And.BeEmpty();
        result.SuggestedConstraints.Should().NotBeNull().And.BeEmpty();
        result.SuggestedAssumptions.Should().NotBeNull().And.BeEmpty();
        result.SuggestedRequiredCapabilities.Should().NotBeNull().And.BeEmpty();
        result.DeniedConstraints.Should().NotBeNull().And.BeEmpty();
        result.DeniedAssumptions.Should().NotBeNull().And.BeEmpty();
        result.DeniedRequiredCapabilities.Should().NotBeNull().And.BeEmpty();
    }
}
