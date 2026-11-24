using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Maps <c>dbo.FindingsSnapshots.GenerationStatus</c> string rows to
///     <see cref="FindingsSnapshotGenerationStatus" />.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin parse wrapper.")]
internal static class FindingsSnapshotGenerationStatusParser
{
    internal static FindingsSnapshotGenerationStatus Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return FindingsSnapshotGenerationStatus.Complete; // Legacy missing value only.

        return ArchLucid.Contracts.Serialization.DefinedEnum.Parse<FindingsSnapshotGenerationStatus>(raw.Trim(), ignoreCase: true);
    }
}
