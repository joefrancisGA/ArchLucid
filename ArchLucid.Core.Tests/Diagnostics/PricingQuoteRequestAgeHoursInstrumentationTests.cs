using System.Diagnostics.Metrics;

using ArchLucid.Contracts.Marketing;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Collection("ArchLucidInstrumentation")]
public sealed class PricingQuoteRequestAgeHoursInstrumentationTests
{
    [Fact]
    public void RecordPricingQuoteRequestAgeHours_emits_histogram_measurement()
    {
        _ = ArchLucidInstrumentation.PricingQuoteRequestAgeHours;

        using PricingQuoteAgeMeasurementCapture capture = PricingQuoteAgeMeasurementCapture.Start();

        ArchLucidInstrumentation.RecordPricingQuoteRequestAgeHours(
            25.5,
            MarketingPricingQuoteRequestBreachStatus.BreachAt24Hours);

        capture.DoubleMeasures.Should().Contain(m =>
            m.Name == "archlucid_pricing_quote_request_age_hours"
            && Math.Abs(m.Value - 25.5) < 0.001
            && m.Tags.Any(t => t.Key == "breach_status" && (string?)t.Value == MarketingPricingQuoteRequestBreachStatus.BreachAt24Hours));
    }

    private sealed class PricingQuoteAgeMeasurementCapture : IDisposable
    {
        private readonly MeterListener _listener = new();

        public List<DoubleMeasurementRecord> DoubleMeasures { get; } = [];

        public static PricingQuoteAgeMeasurementCapture Start()
        {
            PricingQuoteAgeMeasurementCapture capture = new();
            capture._listener.InstrumentPublished = (_, instrument) =>
            {
                if (instrument.Meter.Name != ArchLucidInstrumentation.MeterName)
                    return;

                if (instrument.GetType().Name.Contains("Histogram", StringComparison.Ordinal))
                    capture._listener.EnableMeasurementEvents(instrument);
            };

            _ = capture._listener.SetMeasurementEventCallback<double>((instrument, measurement, tags, _) =>
                capture.DoubleMeasures.Add(new DoubleMeasurementRecord(instrument.Name, measurement, ToList(tags))));

            capture._listener.Start();

            return capture;
        }

        public void Dispose()
        {
            _listener.Dispose();
        }

        private static List<KeyValuePair<string, object?>> ToList(ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = new(tags.Length);

            foreach (KeyValuePair<string, object?> tag in tags)
                list.Add(tag);

            return list;
        }
    }

    private sealed record DoubleMeasurementRecord(
        string Name,
        double Value,
        List<KeyValuePair<string, object?>> Tags);
}
