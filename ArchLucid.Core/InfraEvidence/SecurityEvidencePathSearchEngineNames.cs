namespace ArchLucid.Core.InfraEvidence;

/// <summary>Engine names stored on attack-path search coverage rows.</summary>
public static class SecurityEvidencePathSearchEngineNames
{
    public const string Privilege = "Privilege";

    public const string IntendedReachability = "IntendedReachability";

    public const string ToxicCombination = "ToxicCombination";

    public static string DisplayName(string engineName)
    {
        if (string.Equals(engineName, Privilege, StringComparison.Ordinal))
        {
            return "Privilege";
        }

        if (string.Equals(engineName, IntendedReachability, StringComparison.Ordinal))
        {
            return "Intended reachability";
        }

        if (string.Equals(engineName, ToxicCombination, StringComparison.Ordinal))
        {
            return "Toxic combination";
        }

        return engineName;
    }
}
