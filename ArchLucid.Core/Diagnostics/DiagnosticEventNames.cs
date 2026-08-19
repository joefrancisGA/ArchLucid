namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Canonical structured diagnostic event names (ADR 0053 / TB-332). Lowercase dot-separated lifecycle verbs.
/// </summary>
public static class DiagnosticEventNames
{
    public static class Review
    {
        public const string Created = "review.created";

        public const string StageCompleted = "review.stage.completed";

        public const string Completed = "review.completed";

        public const string Failed = "review.failed";
    }

    public static class Evidence
    {
        public const string IngestStarted = "evidence.ingest.started";

        public const string IngestSucceeded = "evidence.ingest.succeeded";

        public const string IngestFailed = "evidence.ingest.failed";

        public const string ExpansionCompleted = "evidence.expansion.completed";
    }

    public static class Ai
    {
        public const string CompletionStarted = "ai.completion.started";

        public const string CompletionSucceeded = "ai.completion.succeeded";

        public const string CompletionFailed = "ai.completion.failed";

        public const string BudgetExceeded = "ai.budget.exceeded";
    }

    public static class Export
    {
        public const string Started = "export.started";

        public const string Succeeded = "export.succeeded";

        public const string Failed = "export.failed";
    }

    public static class Failure
    {
        public const string Unhandled = "failure.unhandled";

        public const string Dependency = "failure.dependency";

        public const string Validation = "failure.validation";
    }
}
