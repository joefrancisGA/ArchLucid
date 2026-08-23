namespace ArchLucid.Application.Planning;

/// <summary>
///     Drops semantically duplicate constraint or assumption suggestions after exact-match normalization.
/// </summary>
public interface IArchitectureRequestDraftSemanticUniquePass
{
    /// <summary>
    ///     Returns candidates that are not semantically duplicate of <paramref name="existingItems" />
    ///     or of an earlier kept candidate (first-wins within the batch).
    /// </summary>
    Task<string[]> FilterDuplicatesAsync(
        ArchitectureRequestDraftListKind listKind,
        IReadOnlyList<string> existingItems,
        IReadOnlyList<string> candidates,
        CancellationToken cancellationToken);
}
