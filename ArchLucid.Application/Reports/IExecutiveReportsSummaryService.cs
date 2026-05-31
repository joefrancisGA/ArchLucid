namespace ArchLucid.Application.Reports;

public interface IExecutiveReportsSummaryService
{
    Task<ExecutiveSummaryResult> BuildAsync(CancellationToken cancellationToken = default);
}
