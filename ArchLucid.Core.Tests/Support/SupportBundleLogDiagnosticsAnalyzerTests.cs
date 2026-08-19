using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Support;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SupportBundleLogDiagnosticsAnalyzerTests
{
    [Fact]
    public void Analyze_detects_timeout_unauthorized_rate_limit_and_server_errors()
    {
        const string log = """
                           request failed with timeout after 30s
                           HTTP 401 Unauthorized from identity
                           received 429 Too Many Requests
                           upstream returned 503 Service Unavailable
                           """;

        IReadOnlyList<SupportBundleLogDiagnosticFinding> findings = SupportBundleLogDiagnosticsAnalyzer.Analyze(log);

        findings.Select(static f => f.Title).Should().Contain([
            "Timeouts or deadline exceeded",
            "Authentication failures (401 / Unauthorized)",
            "Rate limiting (429 / throttling)",
            "Upstream or API server errors (5xx)",
        ]);
    }

    [Fact]
    public void BuildSummary_with_no_log_text_lists_none_detected()
    {
        string summary = SupportBundleLogDiagnosticsAnalyzer.BuildSummary(null, DateTimeOffset.Parse("2026-05-21T12:00:00Z"));

        summary.Should().Contain("No log excerpt was available");
        summary.Should().Contain("(none detected");
    }
}
