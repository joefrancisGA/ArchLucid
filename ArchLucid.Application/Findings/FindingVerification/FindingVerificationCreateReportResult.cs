using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationCreateReportResult
{
    public FindingVerificationReportResponse Response
    {
        get;
        init;
    } = null!;

    public bool CreatedNewReport
    {
        get;
        init;
    }
}
