namespace ArchLucid.Application.Reports;

public interface ISponsorReportsSummaryService
{
    Task<SponsorReportResult> BuildAsync(CancellationToken cancellationToken = default);
}
