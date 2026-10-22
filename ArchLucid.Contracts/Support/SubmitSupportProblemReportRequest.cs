namespace ArchLucid.Contracts.Support;

public sealed class SubmitSupportProblemReportRequest
{
    public ReportProblemContextDto? Context
    {
        get;
        set;
    }

    public string? OperatorNote
    {
        get;
        set;
    }

    public bool ConsentGranted
    {
        get;
        set;
    }

    public bool AttachSupportBundle
    {
        get;
        set;
    }
}
