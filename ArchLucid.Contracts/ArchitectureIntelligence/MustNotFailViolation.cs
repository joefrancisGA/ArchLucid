namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class MustNotFailViolation
{
    public MustNotFailClass Class
    {
        get;
        set;
    }

    public string Message
    {
        get;
        set;
    } = null!;

    public bool Blocked
    {
        get;
        set;
    }

    public string? FindingId
    {
        get;
        set;
    }

    public string? RecommendationId
    {
        get;
        set;
    }
}
