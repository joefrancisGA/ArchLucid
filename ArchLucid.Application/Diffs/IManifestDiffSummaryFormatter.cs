namespace ArchLucid.Application.Diffs;

public interface IManifestDiffSummaryFormatter
{
    string FormatMarkdown(ManifestDiffResult diff);
}
