namespace ArchLucid.Contracts.Serialization;

/// <summary>Boundary parsing for enums whose values must be declared by the contract.</summary>
public static class DefinedEnum
{
    /// <summary>Accepts named members and defined numeric ordinals. Flags combinations require a separate policy.</summary>
    public static bool TryParse<TEnum>(string? raw, bool ignoreCase, out TEnum value)
        where TEnum : struct, Enum
    {
        if (raw is not null && !raw.Contains(',')
            && Enum.TryParse(raw, ignoreCase, out TEnum candidate) && Enum.IsDefined(candidate))
        {
            value = candidate;
            return true;
        }

        value = default;
        return false;
    }

    /// <summary>Rejects invalid persisted or external values instead of inventing a valid state.</summary>
    public static TEnum Parse<TEnum>(string raw, bool ignoreCase = false)
        where TEnum : struct, Enum
    {
        ArgumentNullException.ThrowIfNull(raw);
        if (TryParse(raw, ignoreCase, out TEnum value))
            return value;

        throw new ArgumentException($"Unknown {typeof(TEnum).Name} value '{raw}'.", nameof(raw));
    }
}
