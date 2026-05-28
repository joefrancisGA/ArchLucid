using ArchLucid.Core.Support;

namespace ArchLucid.Cli.Support;

/// <summary>
///     Finishes <see cref="SupportBundleManifest" /> after all section files are known (inventory + redaction metadata).
/// </summary>
public static class SupportBundleFinalManifestBuilder
{
    /// <summary>Returns lexicographically sorted bundle root file names (the CLI support-bundle layout).</summary>
    public static IReadOnlyList<string> LexOrderedSectionFileNames()
    {
        string[] files =
        [
            SupportBundleArchiveWriter.ApiContractFileName,
            SupportBundleArchiveWriter.BuildFileName,
            SupportBundleArchiveWriter.ConfigFileName,
            SupportBundleArchiveWriter.EnvironmentFileName,
            SupportBundleArchiveWriter.HealthFileName,
            SupportBundleArchiveWriter.LogsFileName,
            SupportBundleArchiveWriter.ManifestFileName,
            SupportBundleArchiveWriter.ReadmeFileName,
            SupportBundleArchiveWriter.ReferencesFileName,
            SupportBundleLayout.NextStepsFileName,
            SupportBundleArchiveWriter.TriageIndexJsonFileName,
            SupportBundleArchiveWriter.TriageIndexMarkdownFileName,
            SupportBundleArchiveWriter.WorkspaceFileName
        ];

        Array.Sort(files, StringComparer.Ordinal);

        return files;
    }

    /// <summary>Clones baseline triage manifest fields and attaches post-write inventory metadata.</summary>
    public static SupportBundleManifest WithInventory(
        SupportBundleManifest baseline,
        bool redactionPassAppliedToSerializedSections)
    {
        ArgumentNullException.ThrowIfNull(baseline);

        return new SupportBundleManifest
        {
            BundleFormatVersion = baseline.BundleFormatVersion,
            CreatedUtc = baseline.CreatedUtc,
            CliWorkingDirectory = baseline.CliWorkingDirectory,
            ArchLucidJsonPath = baseline.ArchLucidJsonPath,
            ArchLucidJsonPresent = baseline.ArchLucidJsonPresent,
            TriageReadOrder = baseline.TriageReadOrder,
            Notes = baseline.Notes,
            IncludedFilesLexOrder = LexOrderedSectionFileNames(),
            RedactionPassAppliedToSerializedSections = redactionPassAppliedToSerializedSections,
            RedactionRulesApplied = redactionPassAppliedToSerializedSections
                ? [.. SupportBundleRedactor.TextPatternRedactionRules]
                : [],
        };
    }
}
