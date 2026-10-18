namespace ArchLucid.Core.InfraEvidence;

/// <summary>Engine names stored on attack-path search coverage rows.</summary>
public static class SecurityEvidencePathSearchEngineNames
{
    public const string Privilege = "Privilege";

    public const string IntendedReachability = "IntendedReachability";

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

        return engineName;
    }
}
