namespace ArchLucid.Core.InfraEvidence;

/// <summary>SA-10 cut-point defaults — advisory only; never auto-apply.</summary>
public static class SecurityEvidenceCutPointConstants
{
    public const string RuleVersion = "SA10-cut-v1";

    /// <summary>
    ///     Operational cost weight (higher = harder to change).
    ///     LeverageScore = PathsCollapsed / weight — cheaper class wins ties on collapse count.
    /// </summary>
    public static decimal OperationalCostWeight(SecurityEvidenceCutPointOperationalCostClass costClass) =>
        costClass switch
        {
            SecurityEvidenceCutPointOperationalCostClass.PublicAccessProperty => 1m,
            SecurityEvidenceCutPointOperationalCostClass.PrivateEndpointDns => 2m,
            SecurityEvidenceCutPointOperationalCostClass.NetworkNsG => 3m,
            SecurityEvidenceCutPointOperationalCostClass.RoleAssignment => 4m,
            SecurityEvidenceCutPointOperationalCostClass.IdentityFederation => 5m,
            SecurityEvidenceCutPointOperationalCostClass.Unknown => 3m,
            _ => 3m,
        };

    public static decimal ComputeLeverageScore(
        int pathsCollapsed,
        SecurityEvidenceCutPointOperationalCostClass costClass)
    {
        if (pathsCollapsed <= 0)
        {
            return 0m;
        }

        decimal weight = OperationalCostWeight(costClass);

        if (weight <= 0m)
        {
            return 0m;
        }

        // Squared collapse count lets shared choke points outrank disjoint single-path cuts;
        // equal collapse counts still prefer cheaper operational cost via the divisor.
        return pathsCollapsed * pathsCollapsed / weight;
    }
}
