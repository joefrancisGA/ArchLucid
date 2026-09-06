using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Resolves customer-visible architecture display names from draft documents (CA-15).
///     Explicit rename (CA-10) is the only path that overwrites a non-untitled identity name.
/// </summary>
public static class ArchitectureIdentityDisplayNameResolver
{
    public static string ResolveFromDraft(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (!string.IsNullOrWhiteSpace(document.SystemName))
            return document.SystemName.Trim();

        if (!string.IsNullOrWhiteSpace(document.FreeTextIntent))
            return document.FreeTextIntent.Trim();

        return ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture;
    }

    /// <summary>
    ///     Returns a trimmed system title for a one-time untitled upgrade, or null when no upgrade applies.
    /// </summary>
    public static string? ResolveUntitledUpgradeCandidate(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (!string.IsNullOrWhiteSpace(document.SystemName))
            return document.SystemName.Trim();

        return null;
    }

    public static bool IsUntitledDisplayName(string? displayName) =>
        string.Equals(
            displayName?.Trim(),
            ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture,
            StringComparison.Ordinal);
}
