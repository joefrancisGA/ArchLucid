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

        if (string.Equals(normalized, "high-assurance", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "high assurance", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "high_assurance", StringComparison.OrdinalIgnoreCase))
        {
            profile = AgentModelExecutionProfile.HighAssurance;

            return true;
        }

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
