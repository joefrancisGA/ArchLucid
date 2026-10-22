namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// One group of ARM types the Executive diagram always surfaces (IDL-06).
/// <see cref="Key" /> is the stable token shared with the UI query string; <see cref="OverflowNoun" />
/// is the plural phrase used on the <c>+N more …</c> rollup node when the tier exceeds its budget.
/// </summary>
public sealed record ExecutiveAlwaysShowTier(
    string Key,
    string Label,
    string OverflowNoun,
    IReadOnlyList<string> ArmTypes);
