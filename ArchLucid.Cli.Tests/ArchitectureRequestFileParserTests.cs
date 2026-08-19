using System.Text;

using ArchLucid.Cli.Request;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRequestFileParserTests
{
    [Fact]
    public void ParseFromUtf8_positive_deserializes_architecture_request()
    {
        const string json = """
                            {
                              "requestId": "demo-001",
                              "systemName": "PilotService",
                              "description": "Design a small internal API with basic security and observability.",
                              "environment": "dev",
                              "cloudProvider": "Azure"
                            }
                            """;
        ArchitectureRequestFileParseOutcome outcome =
            ArchitectureRequestFileParser.ParseFromUtf8(Encoding.UTF8.GetBytes(json), "inline");

        outcome.IsSuccess.Should().BeTrue();
        outcome.Request!.SystemName.Should().Be("PilotService");
        outcome.Request.RequestId.Should().Be("demo001");
        outcome.Request.Environment.Should().Be("dev");
    }

    [Fact]
    public void ApplyRequestIdOverride_replaces_request_id()
    {
        ArchitectureRequestFileParseOutcome parsed = ArchitectureRequestFileParser.ParseFromUtf8(
            Encoding.UTF8.GetBytes(
                """
                {
                  "requestId": "old-id",
                  "systemName": "Svc",
                  "description": "1234567890ab",
                  "environment": "dev",
                  "cloudProvider": "Azure"
                }
                """),
            "inline");

        parsed.IsSuccess.Should().BeTrue();

        ArchitectureRequestFileParseOutcome overridden =
            ArchitectureRequestFileParser.ApplyRequestIdOverride(parsed.Request!, "pilot-002", "inline");

        overridden.IsSuccess.Should().BeTrue();
        overridden.Request!.RequestId.Should().Be("pilot002");
    }

    [Fact]
    public void ParseFromUtf8_missing_system_name_returns_bad_request()
    {
        const string json = """
                            {
                              "description": "1234567890ab"
                            }
                            """;
        ArchitectureRequestFileParseOutcome outcome =
            ArchitectureRequestFileParser.ParseFromUtf8(Encoding.UTF8.GetBytes(json), "bad.json");

        outcome.IsSuccess.Should().BeFalse();
        outcome.FailureCode.Should().Be(ArchitectureRequestFileParseFailureCode.BadRequest);
        outcome.Message.Should().Contain("systemName");
    }
}
