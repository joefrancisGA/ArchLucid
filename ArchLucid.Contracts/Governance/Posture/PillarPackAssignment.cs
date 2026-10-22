namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>
///     Policy-pack assignment projected onto a pillar for posture examination state (TB-2375).
/// </summary>
public sealed class PillarPackAssignment
{
    public string PillarKey
    {
        get;
        init;
    } = null!;

    public Guid PolicyPackId
    {
        get;
        init;
    }

    public string PolicyPackName
    {
        get;
        init;
    } = null!;

    public string PolicyPackVersion
    {
        get;
        init;
    } = null!;

    public string ScopeLevel
    {
        get;
        init;
    } = null!;

    public bool IsEnabled
    {
        get;
        init;
    }

    public DateTimeOffset AssignedUtc
    {
        get;
        init;
    }
}
