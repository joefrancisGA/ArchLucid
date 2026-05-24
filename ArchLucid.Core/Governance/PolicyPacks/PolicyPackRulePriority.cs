namespace ArchLucid.Core.Governance.PolicyPacks;

public static class PolicyPackRulePriority
{
    public const string P0 = "P0";

    public const string P1 = "P1";

    public const string P2 = "P2";

    public const string Default = P1;

    public const string AdvisoryDefaultsKey = "priorityFloor";

    public const string UnsetFloorIncludesAllTiers = P2;
}
