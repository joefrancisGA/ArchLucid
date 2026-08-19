using System.Text.Json;

using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;
[Trait("Category", "Unit")]

public sealed class AzureDevOpsPullRequestWireFormatExtrasTests
{
    [Fact]
    public void SerializeThreadCreate_accepts_null_markdown_as_empty_content()
    {
        string raw = AzureDevOpsPullRequestWireFormat.SerializeThreadCreate(null);

        using JsonDocument parsed = JsonDocument.Parse(raw);

        JsonElement comments = parsed.RootElement.GetProperty("comments");

        Assert.Equal(string.Empty, comments[0].GetProperty("content").GetString() ?? string.Empty);
    }

    [Fact]
    public void SerializeStatusCreate_clamps_description_to_512_chars()
    {
        string oversized = new('z', 600);
        string raw = AzureDevOpsPullRequestWireFormat.SerializeStatusCreate(oversized, targetUrl: null);

        using JsonDocument parsed = JsonDocument.Parse(raw);
        JsonElement description = parsed.RootElement.GetProperty("description");

        Assert.Equal(512, description.GetString()?.Length ?? 0);
    }
}
