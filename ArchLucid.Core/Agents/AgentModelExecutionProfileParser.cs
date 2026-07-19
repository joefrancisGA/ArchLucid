namespace ArchLucid.Core.Agents;

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

        if (string.Equals(normalized, "high-assurance", StringComparison.OrdinalIgnoreCase))
        {
            profile = AgentModelExecutionProfile.HighAssurance;

            return true;
        }

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
