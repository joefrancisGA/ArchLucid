using ArchLucid.Application.CapacityPlanning;
using FluentAssertions;

namespace ArchLucid.Application.Tests.CapacityPlanning;

[Trait("Category", "Unit")]
public sealed class WorkloadTelemetryObservationExportTests
{
    [Fact]
    public void Supported_interval_counter_produces_importable_history()
    {
        var utc = new DateTimeOffset(2026, 10, 28, 18, 0, 0, TimeSpan.Zero);
        var actual = new WorkloadTelemetryObservationExport.Aggregate(
            "archlucid_llm_prompt_tokens_total", "tokens", 950m, utc, "AGGREGATE_INTERVAL_DELTA");
        var forecast = new WorkloadTelemetryObservationExport.Forecast(
            "revision-1", "AiInference", "archlucid_llm_prompt_tokens_total", "tokens", 1000m);
        var export = WorkloadTelemetryObservationExport.Export(actual, forecast);
        export.Json.Should().NotBeNullOrWhiteSpace();
        var history = WorkloadForecastHistory.Import(export.Json!);
        history.Single().Actual.Should().Be(950m);
        WorkloadForecastHistory.Summarize(history).Single().MeanAbsoluteError.Should().Be(50m);
    }

    [Fact]
    public void Cumulative_values_and_unrecognized_metrics_fail_closed()
    {
        var utc = new DateTimeOffset(2026, 10, 28, 18, 0, 0, TimeSpan.Zero);
        var forecast = new WorkloadTelemetryObservationExport.Forecast(
            "rev", "AiInference", "archlucid_llm_prompt_tokens_total", "tokens", 20m);
        var cumulative = new WorkloadTelemetryObservationExport.Aggregate(
            "archlucid_llm_prompt_tokens_total", "tokens", 20m, utc, "CUMULATIVE");
        WorkloadTelemetryObservationExport.Export(cumulative, forecast).Json.Should().BeNull();
        var wrong = cumulative with { MetricName = "tenant_id", MeasurementScope = "AGGREGATE_INTERVAL_DELTA" };
        WorkloadTelemetryObservationExport.Export(wrong, forecast).Json.Should().BeNull();
    }
}
