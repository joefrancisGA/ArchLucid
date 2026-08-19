using ArchLucid.Application.Exports.ArchitectureReviewBoard;

namespace ArchLucid.Application.Exports;

public interface IRunSummaryOnePagerExportService
{
    Task<RunSummaryOnePagerExportResult> GenerateMarkdownAsync(string runId, CancellationToken cancellationToken);
}

public sealed class RunSummaryOnePagerExportResult
{
    public byte[] Content
    {
        get;
        init;
    } = [];

    public string FileName
    {
        get;
        init;
    } = "";

    public string ContentType
    {
        get;
        init;
    } = "text/markdown; charset=utf-8";
}
