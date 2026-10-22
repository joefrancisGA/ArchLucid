using System.Text.Json;

using ArchLucid.Cli;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Cli")]
public sealed class CliJsonTests
{
    [Fact]
    public void WriteFailureLine_serializes_error_payload()
    {
        using StringWriter writer = new();

        CliJson.WriteFailureLine(writer, 2, "bad_input");

        JsonDocument doc = JsonDocument.Parse(writer.ToString());

        doc.RootElement.GetProperty("ok").GetBoolean().Should().BeFalse();
        doc.RootElement.GetProperty("exitCode").GetInt32().Should().Be(2);
        doc.RootElement.GetProperty("error").GetString().Should().Be("bad_input");
    }

    [Fact]
    public void WriteFailureLine_includes_message_when_provided()
    {
        using StringWriter writer = new();

        CliJson.WriteFailureLine(writer, 1, "failed", "details");

        JsonDocument doc = JsonDocument.Parse(writer.ToString());

        doc.RootElement.GetProperty("message").GetString().Should().Be("details");
    }

    [Fact]
    public void WriteSuccessLine_serializes_payload()
    {
        using StringWriter writer = new();

        CliJson.WriteSuccessLine(writer, new { ok = true, count = 3 });

        JsonDocument doc = JsonDocument.Parse(writer.ToString());

        doc.RootElement.GetProperty("ok").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("count").GetInt32().Should().Be(3);
    }
}
