namespace ArchLucid.Application.Architecture;

/// <summary>AS-090: effective architecture share capabilities after intersecting workspace authority.</summary>
public sealed class ArchitectureShareAccessEvaluation
{
    public bool ArchitectureFound
    {
        get;
        init;
    }

    public bool RestrictToShares
    {
        get;
        init;
    }

    public string? ShareRole
    {
        get;
        init;
    }

    public bool CanRead
    {
        get;
        init;
    }

    public bool CanDecide
    {
        get;
        init;
    }

    public bool CanAdmin
    {
        get;
        init;
    }

    public static ArchitectureShareAccessEvaluation ArchitectureNotFound() =>
        new() { ArchitectureFound = false };
}
