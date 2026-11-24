using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Contracts.Tests.Advisory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RecommendationSourceEvidenceLinksNullTests
{
    [Fact]
    public void ParseJson_IgnoresNullEntries_PreservesValidLinks()
    {
        var links = RecommendationSourceEvidenceLinksComposer.ParseJson(
            """[null,{"kind":"finding","id":"f-1"},null]""");

        var link = Assert.Single(links);
        Assert.Equal("finding", link.Kind);
        Assert.Equal("f-1", link.Id);
    }

    [Fact]
    public void FromRecord_AllNullEntries_UsesSupportingIdsFallback()
    {
        var record = new RecommendationRecord
        {
            SourceEvidenceLinksJson = "[null]",
            SupportingFindingIdsJson = """["f-1"]"""
        };

        var link = Assert.Single(RecommendationSourceEvidenceLinksComposer.FromRecord(record));
        Assert.Equal("finding", link.Kind);
        Assert.Equal("f-1", link.Id);
    }

    [Fact]
    public void ParseJson_AllNullEntries_ReturnsEmpty()
    {
        Assert.Empty(RecommendationSourceEvidenceLinksComposer.ParseJson("[null,null]"));
    }
}
