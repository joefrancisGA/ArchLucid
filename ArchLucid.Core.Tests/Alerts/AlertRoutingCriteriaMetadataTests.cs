using ArchLucid.Core.Alerts.Delivery;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Alerts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AlertRoutingCriteriaMetadataTests
{
    [Theory]
    [InlineData("[]")]
    [InlineData("null")]
    [InlineData("42")]
    [InlineData("true")]
    [InlineData("\"legacy\"")]
    public void Parse_treats_non_object_metadata_as_empty_preferences(string metadataJson)
    {
        var criteria = AlertRoutingCriteriaMetadata.Parse(metadataJson);

        criteria.Tags.Should().BeEmpty();
        criteria.FindingTypes.Should().BeEmpty();
        criteria.Severities.Should().BeEmpty();
    }
}
