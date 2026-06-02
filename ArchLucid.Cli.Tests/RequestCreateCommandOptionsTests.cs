using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RequestCreateCommandOptionsTests
{
    [Fact]
    public void Parse_positive_reads_from_file_and_request_id()
    {
        RequestCreateCommandOptions? options = RequestCreateCommandOptions.Parse(
            ["--from-file", "templates/architecture-requests/greenfield-design-review.json", "--request-id", "pilot-001"],
            out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.InputPath.Should().Contain("greenfield-design-review.json");
        options.RequestIdOverride.Should().Be("pilot-001");
    }

    [Fact]
    public void Parse_missing_from_file_returns_null()
    {
        RequestCreateCommandOptions? options = RequestCreateCommandOptions.Parse([], out string? error);

        options.Should().BeNull();
        error.Should().Contain("--from-file");
    }
}
