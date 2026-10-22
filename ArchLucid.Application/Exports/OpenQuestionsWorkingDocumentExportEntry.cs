namespace ArchLucid.Application.Exports;

/// <summary>One open-questions row routed to the working-document export bucket (LP-16).</summary>
public sealed class OpenQuestionsWorkingDocumentExportEntry
{
    public string Key
    {
        get;
        set;
    } = string.Empty;

    public string Value
    {
        get;
        set;
    } = string.Empty;
}
