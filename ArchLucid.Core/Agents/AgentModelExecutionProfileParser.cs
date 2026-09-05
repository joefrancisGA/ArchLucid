namespace ArchLucid.Core.Agents;

using System.Globalization;

/// <summary>Parses API and tenant-setting profile labels (TB-870).</summary>
public static class AgentModelExecutionProfileParser
{
    public static bool TryParse(string? value, out AgentModelExecutionProfile profile)
    {
        profile = AgentModelExecutionProfile.Balanced;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        if (Enum.TryParse(normalized, ignoreCase: true, out AgentModelExecutionProfile parsed)
            && Enum.IsDefined(parsed))
        {
            profile = parsed;

            return true;
        }

        if (TryParseWholeNumberString(normalized, out int ordinal)
            && Enum.IsDefined(typeof(AgentModelExecutionProfile), ordinal))
        {
            profile = (AgentModelExecutionProfile)ordinal;

            return true;
        }

        if (TryParseBooleanOrdinalString(normalized, out int booleanOrdinal)
            && Enum.IsDefined(typeof(AgentModelExecutionProfile), booleanOrdinal))
        {
            profile = (AgentModelExecutionProfile)booleanOrdinal;

            return true;
        }

        if (string.Equals(normalized, "high-assurance", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "high assurance", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "high_assurance", StringComparison.OrdinalIgnoreCase))
        {
            profile = AgentModelExecutionProfile.HighAssurance;

            return true;
        }

        return false;
    }

    private static bool TryParseBooleanOrdinalString(string raw, out int ordinal)
    {
        if (TryParseBooleanString(raw, out bool boolean))
        {
            ordinal = boolean ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("1", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("on", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("0", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("no", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("off", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    public static string Format(AgentModelExecutionProfile profile)
    {
        return profile switch
        {
            AgentModelExecutionProfile.Economy => nameof(AgentModelExecutionProfile.Economy),
            AgentModelExecutionProfile.HighAssurance => nameof(AgentModelExecutionProfile.HighAssurance),
            _ => nameof(AgentModelExecutionProfile.Balanced)
        };
    }
}
