namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationReportNotFoundException : Exception
{
    public FindingVerificationReportNotFoundException(Guid runId, Guid reportId)
        : base($"Finding verification report '{reportId:D}' was not found for run '{runId:D}'.")
    {
        RunId = runId;
        ReportId = reportId;
    }

    public Guid RunId
    {
        get;
    }

    public Guid ReportId
    {
        get;
    }
}
