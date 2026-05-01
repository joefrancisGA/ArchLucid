using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Support;

public sealed class SupportBundleNextStepsBuilderTests
{
    [Fact]
    public void BuildForApiHost_Includes_correlation_and_retention_guidance()
    {
        SupportBundleNextStepsDocument doc = SupportBundleNextStepsBuilder.BuildForApiHost("2026-05-01T12:00:00Z", new Dictionary<string, string>());

        doc.Source.Should().Be("api");
        doc.GeneratedUtc.Should().Be("2026-05-01T12:00:00Z");
        doc.Disclaimer.Should().Be(SupportBundleNextStepsDocument.AdvisoryDisclaimer);
        doc.SummaryLines.Should().Contain(s => s.Contains("X-Correlation-ID", StringComparison.Ordinal));
        doc.SummaryLines.Should().Contain(s => s.Contains("PENDING_QUESTIONS", StringComparison.Ordinal));
    }

    [Fact]
    public void BuildForApiHost_When_dotnet_environment_production_Adds_hint()
    {
        Dictionary<string, string> env = new(StringComparer.OrdinalIgnoreCase) { ["DOTNET_ENVIRONMENT"] = "Production" };

        SupportBundleNextStepsDocument doc = SupportBundleNextStepsBuilder.BuildForApiHost("2026-05-01T12:00:00Z", env);

        doc.Hints.Should().Contain(h => h.Id == "dotnet-environment-production");
        doc.SummaryLines.Should().Contain(s => s.Contains("DOTNET_ENVIRONMENT=Production", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BuildForCliClient_When_live_transport_failed_Explains_unreachable()
    {
        SupportBundleNextStepsDocument doc = SupportBundleNextStepsBuilder.BuildForCliClient(
            "2026-05-01T12:00:00Z",
            healthLiveStatus: 0,
            healthReadyStatus: 0,
            healthCombinedStatus: 0,
            openApiHttpStatus: 0,
            apiVersionProbeError: null,
            archlucidJsonPresent: true,
            hasLocalLogExcerpt: false);

        doc.Source.Should().Be("cli");
        doc.Hints.Should().Contain(h => h.Id == "health-live-transport");
        doc.SummaryLines.Should().Contain(s => s.Contains("transport error", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BuildForCliClient_When_probes_ok_Adds_success_line_without_failure_hints()
    {
        SupportBundleNextStepsDocument doc = SupportBundleNextStepsBuilder.BuildForCliClient(
            "2026-05-01T12:00:00Z",
            healthLiveStatus: 200,
            healthReadyStatus: 200,
            healthCombinedStatus: 200,
            openApiHttpStatus: 200,
            apiVersionProbeError: null,
            archlucidJsonPresent: true,
            hasLocalLogExcerpt: false);

        doc.Hints.Should().BeEmpty();
        doc.SummaryLines.Should().Contain(s => s.Contains("reported success", StringComparison.OrdinalIgnoreCase));
    }
}
