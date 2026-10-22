namespace ArchLucid.Application.Import;

/// <summary>Outcome of <see cref="IImportRequestFileService.ImportAsync" />.</summary>
public sealed class ImportRequestFileResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid ImportedRequestId
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = "Draft";

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public string? FailureDetail
    {
        get;
        init;
    }

    public IReadOnlyList<string> ValidationErrors
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> ContentSafetyReasons
    {
        get;
        init;
    } = [];
}
