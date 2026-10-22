using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecondRunDiagnosticsTests
{
    [Fact]
    public async Task WriteAsync_includes_step_http_status_correlation_and_audit_names()
    {
        StringWriter writer = new();

        await SecondRunDiagnostics.WriteAsync(
            writer,
            step: "commit",
            httpStatus: 503,
            correlationId: "corr-123",
            apiDetail: "service unavailable");

        string text = writer.ToString();

        text.Should().Contain("commit");
        text.Should().Contain("503");
        text.Should().Contain("corr-123");
        text.Should().Contain("service unavailable");
        text.Should().Contain("Audit event names");
        text.Should().Contain("Run.Created");
    }
}
