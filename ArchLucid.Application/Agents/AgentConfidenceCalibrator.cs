using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Agents;

/// <inheritdoc cref="IAgentConfidenceCalibrator" />
public sealed class AgentConfidenceCalibrator(
    IAgentConfidenceCalibrationSampleRepository sampleRepository,
    IOptions<AgentConfidenceCalibrationOptions> options) : IAgentConfidenceCalibrator
{
    private readonly IAgentConfidenceCalibrationSampleRepository _sampleRepository =
        sampleRepository ?? throw new ArgumentNullException(nameof(sampleRepository));

    private readonly AgentConfidenceCalibrationOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    /// <inheritdoc />
    public async Task<double> CalibrateAsync(
        AgentType agentType,
        double rawConfidence,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
            return ClampUnit(rawConfidence);

        IReadOnlyList<AgentConfidenceCalibrationSampleRow> samples =
            await _sampleRepository
                .GetRecentByAgentTypeAsync(agentType, _options.SampleCount, cancellationToken)
                .ConfigureAwait(false);

        if (samples.Count < _options.MinimumSamplesForCalibration)
            return ClampUnit(rawConfidence);

        IReadOnlyList<CalibrationKnot> knots = BuildIsotonicKnots(samples);

        if (knots.Count == 0)
            return ClampUnit(rawConfidence);

        return ClampUnit(Interpolate(knots, rawConfidence));
    }

    private static double ClampUnit(double value) => Math.Clamp(value, 0.0, 1.0);

    private static double Interpolate(IReadOnlyList<CalibrationKnot> knots, double rawConfidence)
    {
        double x = ClampUnit(rawConfidence);

        if (x <= knots[0].RawConfidence)
            return knots[0].CalibratedScore;

        CalibrationKnot last = knots[^1];

        if (x >= last.RawConfidence)
            return last.CalibratedScore;

        for (int i = 1; i < knots.Count; i++)
        {
            CalibrationKnot right = knots[i];
            CalibrationKnot left = knots[i - 1];

            if (x > right.RawConfidence)
                continue;

            double span = right.RawConfidence - left.RawConfidence;

            if (span <= 0.0)
                return right.CalibratedScore;

            double t = (x - left.RawConfidence) / span;

            return left.CalibratedScore + (t * (right.CalibratedScore - left.CalibratedScore));
        }

        return last.CalibratedScore;
    }

    /// <summary>
    ///     Pool-adjacent-violators style isotonic regression on binned raw-confidence means, then piecewise-linear lookup.
    /// </summary>
    internal static IReadOnlyList<CalibrationKnot> BuildIsotonicKnots(IReadOnlyList<AgentConfidenceCalibrationSampleRow> samples)
    {
        List<AgentConfidenceCalibrationSampleRow> ordered =
            samples.OrderBy(s => s.RawConfidence).ThenBy(s => s.SemanticScore).ToList();

        List<CalibrationBin> bins = [];

        foreach (AgentConfidenceCalibrationSampleRow sample in ordered)
        {
            if (bins.Count == 0)
            {
                bins.Add(new CalibrationBin(sample.RawConfidence, sample.SemanticScore));

                continue;
            }

            CalibrationBin tail = bins[^1];

            if (Math.Abs(sample.RawConfidence - tail.RawConfidence) < 1e-9)
            {
                tail.Add(sample.SemanticScore);

                continue;
            }

            bins.Add(new CalibrationBin(sample.RawConfidence, sample.SemanticScore));
        }

        List<double> pooledScores = bins.Select(b => b.MeanSemantic).ToList();

        EnforceMonotonicNonDecreasing(pooledScores);

        List<CalibrationKnot> knots = [];

        for (int i = 0; i < bins.Count; i++)
            knots.Add(new CalibrationKnot(bins[i].RawConfidence, pooledScores[i]));

        return knots;
    }

    private static void EnforceMonotonicNonDecreasing(List<double> values)
    {
        int index = 0;

        while (index < values.Count)
        {
            int blockStart = index;
            double blockMax = values[index];
            index++;

            while (index < values.Count && values[index] + 1e-12 < blockMax)
            {
                blockMax = Math.Max(blockMax, values[index]);
                index++;
            }

            double replacement = blockMax;

            for (int j = blockStart; j < index; j++)
                values[j] = replacement;
        }
    }

    private sealed class CalibrationBin
    {
        private readonly List<double> _semantics = [];

        public CalibrationBin(double rawConfidence, double semanticScore)
        {
            RawConfidence = rawConfidence;
            _semantics.Add(semanticScore);
        }

        public double RawConfidence
        {
            get;
        }

        public void Add(double semanticScore) => _semantics.Add(semanticScore);

        public double MeanSemantic => _semantics.Average();
    }

    internal sealed record CalibrationKnot(double RawConfidence, double CalibratedScore);
}
