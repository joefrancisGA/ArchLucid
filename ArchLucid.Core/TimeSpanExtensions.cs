namespace ArchLucid.Core;

/// <summary>Small helpers for <see cref="TimeSpan" /> where the BCL has no equivalent.</summary>
public static class TimeSpanExtensions
{
    /// <summary>Restricts <paramref name="value" /> to the inclusive range [<paramref name="min" />, <paramref name="max" />].</summary>
    /// <exception cref="ArgumentException">Thrown when <paramref name="min" /> is greater than <paramref name="max" />.</exception>
    public static TimeSpan Clamp(this TimeSpan value, TimeSpan min, TimeSpan max)
    {
        if (min > max)
            throw new ArgumentException($"{nameof(min)} must be less than or equal to {nameof(max)}.", nameof(min));

        return value < min ? min : value > max ? max : value;
    }
}
