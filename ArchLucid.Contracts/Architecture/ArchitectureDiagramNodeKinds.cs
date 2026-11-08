namespace ArchLucid.Contracts.Architecture;

public static class ArchitectureDiagramNodeKinds
{
    public const string User = "user";
    public const string System = "system";
    public const string External = "external";
    public const string Boundary = "boundary";

    /// <summary>
    ///     Honesty token when label inference did not assign a published kind.
    ///     Compile still maps this to a topology resource; it is not a guessed service type.
    /// </summary>
    public const string KindNotStored = "Diagram node kind was not stored.";
}
