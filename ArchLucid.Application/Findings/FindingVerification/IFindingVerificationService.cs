using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.FindingVerification;

public interface IFindingVerificationService
{
    Task<FindingVerificationCreateReportResult> CreateReportAsync(
        ScopeContext scope,
        Guid runId,
        CreateFindingVerificationReportRequest request,
        string triggeredByUserId,
        CancellationToken cancellationToken = default);
}
