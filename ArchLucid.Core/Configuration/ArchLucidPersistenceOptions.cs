namespace ArchLucid.Core.Configuration;

/// <summary>
/// Cross-cutting persistence security switches (see <c>ArchLucid:Persistence</c>).
/// </summary>
public sealed class ArchLucidPersistenceOptions
{
    public const string SectionPath = "ArchLucid:Persistence";

    /// <summary>
    /// When true, allows <see cref="ArchLucid.Core.Scoping.SqlRowLevelSecurityBypassAmbient.Enter"/> together with
    /// process environment <c>ARCHLUCID_ALLOW_RLS_BYPASS=true</c>. Both are required for break-glass RLS bypass.
    /// </summary>
    public bool AllowRlsBypass { get; set; }
}
