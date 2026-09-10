using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.FindingVerification;

public interface IFindingVerificationReportExportApplicationService
{
    Task<byte[]> ExportMarkdownAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default);

    Task<byte[]> ExportDocxAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default);
}
