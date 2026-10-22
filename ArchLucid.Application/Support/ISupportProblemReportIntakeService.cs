using ArchLucid.Contracts.Support;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Support;

public interface ISupportProblemReportIntakeService
{
    Task<SubmitSupportProblemReportResponse> SubmitAsync(
        ScopeContext scope,
        string submittedByActorId,
        string? submittedByMailbox,
        SubmitSupportProblemReportRequest request,
        CancellationToken cancellationToken);
}
