using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IArchitectureReviewRecurrenceNextRunCalculator" />
public sealed class ArchitectureReviewRecurrenceNextRunCalculator(IScanScheduleCalculator scheduleCalculator)
    : IArchitectureReviewRecurrenceNextRunCalculator
{
    private readonly IScanScheduleCalculator _scheduleCalculator =
        scheduleCalculator ?? throw new ArgumentNullException(nameof(scheduleCalculator));

    /// <inheritdoc />
    public bool IsSupportedCronExpression(string cronExpression) =>
        _scheduleCalculator.IsSupportedCronExpression(cronExpression);

    /// <inheritdoc />
    public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc, bool isScheduleEnabled = true)
    {
        if (!isScheduleEnabled)
            return null;

        DateTime normalizedFrom = NormalizeReferenceUtc(fromUtc);
        DateTime? next = _scheduleCalculator.ComputeNextRunUtc(cronExpression, normalizedFrom);

        return NormalizeNextRunUtc(cronExpression, normalizedFrom, next);
    }

    /// <inheritdoc />
    public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count)
    {
        if (count <= 0)
            return Array.Empty<DateTime>();

        List<DateTime> results = new(capacity: count);
        DateTime cursor = NormalizeReferenceUtc(fromUtc);

        for (int index = 0; index < count; index += 1)
        {
            DateTime? next = ComputeNextRunUtc(cronExpression, cursor);

            if (next is null)
                break;

            results.Add(next.Value);
            cursor = next.Value;
        }

        return results;
    }

    private DateTime? NormalizeNextRunUtc(string cronExpression, DateTime fromUtc, DateTime? next)
    {
        if (next is null)
            return null;

        DateTime candidate = SpecifyUtc(next.Value);

        if (candidate <= fromUtc)
        {
            DateTime? advanced = _scheduleCalculator.ComputeNextRunUtc(cronExpression, candidate);

            if (advanced is null || SpecifyUtc(advanced.Value) <= fromUtc)
                return null;

            candidate = SpecifyUtc(advanced.Value);
        }

        return candidate;
    }

    private static DateTime NormalizeReferenceUtc(DateTime reference)
    {
        if (reference.Kind == DateTimeKind.Utc)
            return reference;

        if (reference.Kind == DateTimeKind.Local)
            return reference.ToUniversalTime();

        return DateTime.SpecifyKind(reference, DateTimeKind.Utc);
    }

    private static DateTime SpecifyUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
