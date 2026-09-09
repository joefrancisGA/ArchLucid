namespace ArchLucid.Application.Findings;

/// <summary>Evaluates inventory secret rows against rotation/expiry thresholds (DX-09).</summary>
public static class SecretsLifecycleStaleEvaluator
{
    public sealed record EvaluationResult(bool ShouldEmit, int DaysStale);

    public static EvaluationResult Evaluate(
        SecretsLifecycleInventoryRow row,
        DateTimeOffset utcNow,
        int staleRotationDays,
        int expiryWarningDays)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (row.ExpiryUtc is DateTimeOffset expiryUtc)
        {
            double daysUntilExpiry = (expiryUtc - utcNow).TotalDays;

            if (daysUntilExpiry <= expiryWarningDays)
            {
                int daysStale = row.LastRotatedUtc is DateTimeOffset lastRotated
                    ? Math.Max(0, (int)Math.Floor((utcNow - lastRotated).TotalDays))
                    : staleRotationDays;

                return new EvaluationResult(true, daysStale);
            }
        }

        if (row.LastRotatedUtc is DateTimeOffset rotatedUtc)
        {
            int daysSinceRotation = Math.Max(0, (int)Math.Floor((utcNow - rotatedUtc).TotalDays));

            if (daysSinceRotation >= staleRotationDays)
            {
                return new EvaluationResult(true, daysSinceRotation);
            }
        }

        return new EvaluationResult(false, 0);
    }
}
