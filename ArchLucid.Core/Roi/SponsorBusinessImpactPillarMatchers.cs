namespace ArchLucid.Core.Roi;

/// <summary>Category substring matchers for sponsor business-impact pillars (TB-105).</summary>
public static class SponsorBusinessImpactPillarMatchers
{
    public static readonly string[] Security = ["security", "threat"];

    public static readonly string[] Compliance = ["compliance", "privacy", "regulatory"];

    public static readonly string[] Reliability = ["reliability", "availability", "resilience", "resiliency"];

    public static readonly string[] Cost = ["cost", "finops", "waste", "savings"];

    public static readonly string[] Governance = ["governance", "policy", "control"];
}
