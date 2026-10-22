namespace ArchLucid.Persistence.Value;

public sealed partial class DapperValueReportMetricsReader
{
    private sealed class FindingFeedbackAggRow
    {
        public long NetScore
        {
            get;
            init;
        }

        public long VoteCount
        {
            get;
            init;
        }
    }

    private sealed class TenantBaselineRow
    {
        public decimal? BaselineReviewCycleHours
        {
            get;
            init;
        }

        public string? BaselineReviewCycleSource
        {
            get;
            init;
        }

        public DateTimeOffset? BaselineReviewCycleCapturedUtc
        {
            get;
            init;
        }

        public decimal? BaselineManualPrepHoursPerReview
        {
            get;
            init;
        }

        public int? BaselinePeoplePerReview
        {
            get;
            init;
        }

        public int? ArchitectureTeamSize
        {
            get;
            init;
        }
    }

    private sealed class ReviewCycleMeasureRow
    {
        public decimal? AvgHours
        {
            get;
            init;
        }

        public long Cnt
        {
            get;
            init;
        }
    }

    private sealed class RunStatusSqlRow
    {
        public string LegacyRunStatusLabel
        {
            get;
            init;
        } = "";

        public long Cnt
        {
            get;
            init;
        }
    }
}
