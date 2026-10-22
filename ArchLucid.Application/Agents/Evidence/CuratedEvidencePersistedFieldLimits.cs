namespace ArchLucid.Application.Agents.Evidence;

/// <summary>
///     Column widths for <c>dbo.TenantCuratedEvidenceEntries</c> (migration 182).
/// </summary>
internal static class CuratedEvidencePersistedFieldLimits
{
    public const int TitleMaxLength = 512;

    public const int CatalogEntryIdMaxLength = 128;

    public static void EnsureTitleFits(string title)
    {
        ArgumentNullException.ThrowIfNull(title);

        if (title.Length <= TitleMaxLength)
            return;

        throw new InvalidOperationException(
            $"Curated evidence title length {title.Length} exceeds the persisted Title column width {TitleMaxLength}.");
    }

    public static void EnsureCatalogEntryIdFits(string catalogEntryId)
    {
        ArgumentNullException.ThrowIfNull(catalogEntryId);

        if (catalogEntryId.Length <= CatalogEntryIdMaxLength)
            return;

        throw new InvalidOperationException(
            $"Curated evidence CatalogEntryId length {catalogEntryId.Length} exceeds the persisted column width {CatalogEntryIdMaxLength}.");
    }
}
