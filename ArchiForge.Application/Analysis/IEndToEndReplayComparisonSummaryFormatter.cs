namespace ArchiForge.Application.Analysis;

public interface IEndToEndReplayComparisonSummaryFormatter
{
    string FormatMarkdown(EndToEndReplayComparisonReport report);
}

