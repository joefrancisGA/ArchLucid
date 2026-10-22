namespace ArchLucid.Core.Configuration;

/// <summary>
///     Binds <c>Demo:AnonymousViewer</c>. When <see cref="Enabled"/> is <see langword="true"/>, unauthenticated
///     GETs under <c>/v1/demo/viewer</c> return read-only Contoso-seeded data (rate-limited).
/// </summary>
public sealed class DemoAnonymousViewerOptions
{
    /// <summary>Enables anonymous read-only demo viewer endpoints.</summary>
    public bool Enabled
    {
        get;
        set;
    }
}
