namespace ArchLucid.Application.Planning.AdvisoryDraft;

internal static class AdvisoryDraftOperationSteps
{
    internal const int TotalSteps = 4;

    internal const string Queued = "Queued";

    internal const string ReadingOverview = "Reading architecture overview";

    internal const string Extracting = "Extracting constraints, assumptions, and capabilities";

    internal const string PostProcessing = "Removing duplicate suggestions and checking assumptions";

    internal const string Completing = "Completing suggestions";

    internal const string Complete = "Suggestions ready";

    internal const string Failed = "Suggestion failed";

    internal const string Canceled = "Canceled";
}
