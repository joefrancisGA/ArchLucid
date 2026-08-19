using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class JiraAdfDescriptionBuilderTests
{
    [Fact]
    public void Empty_plain_text_yields_minimal_doc_with_blank_paragraph()
    {
        JsonElement adf = JiraAdfDescriptionBuilder.BuildDescriptionField(string.Empty);

        adf.GetProperty("type").GetString().Should().Be("doc");
        adf.GetProperty("version").GetInt32().Should().Be(1);

        JsonElement content = adf.GetProperty("content");
        content.GetArrayLength().Should().Be(1);
        content[0].GetProperty("type").GetString().Should().Be("paragraph");
        content[0].GetProperty("content").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void Null_plain_text_is_treated_as_empty()
    {
        JsonElement adf = JiraAdfDescriptionBuilder.BuildDescriptionField(null);

        adf.GetProperty("type").GetString().Should().Be("doc");
        adf.GetProperty("content").GetArrayLength().Should().Be(1);
    }

    [Fact]
    public void Multiline_text_maps_to_paragraph_nodes_and_blank_lines()
    {
        JsonElement adf = JiraAdfDescriptionBuilder.BuildDescriptionField("Alpha\n\nBeta");

        JsonElement content = adf.GetProperty("content");
        content.GetArrayLength().Should().Be(3);

        content[0].GetProperty("type").GetString().Should().Be("paragraph");
        content[0].GetProperty("content")[0].GetProperty("type").GetString().Should().Be("text");
        content[0].GetProperty("content")[0].GetProperty("text").GetString().Should().Be("Alpha");

        content[1].GetProperty("type").GetString().Should().Be("paragraph");
        content[1].GetProperty("content").GetArrayLength().Should().Be(0);

        content[2].GetProperty("content")[0].GetProperty("text").GetString().Should().Be("Beta");
    }

    [Fact]
    public void Carriage_return_newline_splits_like_newline()
    {
        JsonElement adf = JiraAdfDescriptionBuilder.BuildDescriptionField("One\r\nTwo");

        JsonElement content = adf.GetProperty("content");
        content.GetArrayLength().Should().Be(2);
        content[0].GetProperty("content")[0].GetProperty("text").GetString().Should().Be("One");
        content[1].GetProperty("content")[0].GetProperty("text").GetString().Should().Be("Two");
    }
}
