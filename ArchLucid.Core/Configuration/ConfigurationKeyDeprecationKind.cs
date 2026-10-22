namespace ArchLucid.Core.Configuration;

/// <summary>
///     Marks catalog keys that remain bindable for backward compatibility but should not appear in new configs.
///     Used by architecture tests and operator docs (see <c>docs/library/CONFIGURATION_REFERENCE.md</c>).
/// </summary>
public enum ConfigurationKeyDeprecationKind
{
    None,

    /// <summary>Legacy binding path or flat property superseded by a canonical section (see <see cref="ConfigurationKeyEntry.DeprecatedReplacementPath" />).</summary>
    DeprecatedBindingPath,
}
