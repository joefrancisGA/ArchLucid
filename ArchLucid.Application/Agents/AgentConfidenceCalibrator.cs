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

    private static double ClampUnit(double value) =>
        double.IsFinite(value) ? Math.Clamp(value, 0.0, 1.0) : 0.0;

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
            if (!double.IsFinite(sample.RawConfidence) || !double.IsFinite(sample.SemanticScore))
                continue;

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

        List<double> pooledScores = PoolAdjacentViolators(bins);

        List<CalibrationKnot> knots = [];

        for (int i = 0; i < bins.Count; i++)
            knots.Add(new CalibrationKnot(bins[i].RawConfidence, pooledScores[i]));

        return knots;
    }

    /// <summary>
    ///     Pool-adjacent-violators: when a later bin's mean is below the previous block, merge by
    ///     sample weight. Replacing the block with its maximum would report that high score for
    ///     every later raw confidence in the violation.
    /// </summary>
    private static List<double> PoolAdjacentViolators(List<CalibrationBin> bins)
    {
        List<PavBlock> blocks = [];

        foreach (CalibrationBin bin in bins)
        {
            blocks.Add(new PavBlock(bin.SampleCount, bin.SemanticSum, binCount: 1));

            while (blocks.Count >= 2)
            {
                PavBlock right = blocks[^1];
                PavBlock left = blocks[^2];

                if (right.Mean + 1e-12 >= left.Mean)
                    break;

                blocks.RemoveAt(blocks.Count - 1);
                blocks.RemoveAt(blocks.Count - 1);
                blocks.Add(left.Merge(right));
            }
        }

        List<double> pooledScores = [];

        foreach (PavBlock block in blocks)
        {
            for (int offset = 0; offset < block.BinCount; offset++)
                pooledScores.Add(block.Mean);
        }

        return pooledScores;
    }

    private sealed class PavBlock
    {
        public PavBlock(int sampleCount, double semanticSum, int binCount)
        {
            SampleCount = sampleCount;
            SemanticSum = semanticSum;
            BinCount = binCount;
        }

        public int SampleCount
        {
            get;
        }

        public double SemanticSum
        {
            get;
        }

        public int BinCount
        {
            get;
        }

        public double Mean => SampleCount == 0 ? 0.0 : SemanticSum / SampleCount;

        public PavBlock Merge(PavBlock other) =>
            new(SampleCount + other.SampleCount, SemanticSum + other.SemanticSum, BinCount + other.BinCount);
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

        public int SampleCount => _semantics.Count;

        public double SemanticSum => _semantics.Sum();
    }

    internal sealed record CalibrationKnot(double RawConfidence, double CalibratedScore);
}
