namespace ArchLucid.Persistence.Connections;

/// <summary>Computes SQL connection-open retry delays with explicit ±20% jitter bounds.</summary>
public static class SqlOpenRetryDelayCalculator
{
    public const double JitterFraction = 0.20;

    public static TimeSpan Calculate(int attemptNumber, TimeSpan baseDelay, int jitterOffsetMilliseconds)
    {
        if (attemptNumber < 1)
            throw new ArgumentOutOfRangeException(nameof(attemptNumber));

        double baseMilliseconds = baseDelay.TotalMilliseconds * Math.Pow(2, attemptNumber - 1);
        double delayMilliseconds = Math.Max(0, baseMilliseconds + jitterOffsetMilliseconds);

        return TimeSpan.FromMilliseconds(delayMilliseconds);
    }

    public static int ComputeJitterSpanMilliseconds(double baseMilliseconds) =>
        (int)(baseMilliseconds * JitterFraction);
}
