namespace ArchLucid.Core.ProductLine;

/// <summary>
///     Resolved product line for an HTTP request after applying deployment config and optional
///     <c>X-ArchLucid-Product-Line</c> (OP-03). <see cref="Both" /> means the host serves both shells
///     and the request did not narrow the line.
/// </summary>
public enum EffectiveProductLineKind
{
    Architecture = 0,

    Security = 1,

    Both = 2,
}
