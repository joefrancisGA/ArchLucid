using ArchLucid.Core.Retrieval;

namespace ArchLucid.Application.Runs;

internal static class RetrievalGroundingTraceMetricRollup
{
    /// <summary>
    ///     Sums <paramref name="selector" /> across traces only when every trace returns a value; otherwise null (omitted metric).
    /// </summary>
    public static int? SumIntWhenAllPresent(
        IReadOnlyList<RetrievalGroundingTraceRecord> traces,
        Func<RetrievalGroundingTraceRecord, int?> selector)
    {
        if (traces.Count == 0)
            return null;

        int sum = 0;

        foreach (RetrievalGroundingTraceRecord trace in traces)
        {
            int? value = selector(trace);

            if (value is not int number)
                return null;

            sum += number;
        }

        return sum;
    }
}
