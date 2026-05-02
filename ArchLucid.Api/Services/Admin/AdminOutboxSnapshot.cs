namespace ArchLucid.Api.Services.Admin;

/// <summary>
/// Pending outbox depths for operator dashboards. Authority backlog counts actionable deferred pipeline rows; dead-letter
/// rows require operator replay or remediation.
/// </summary>
public sealed record AdminOutboxSnapshot(
    long AuthorityPipelineWorkPending,
    long AuthorityPipelineWorkDeadLetter,
    long RetrievalIndexingPending,
    long IntegrationEventOutboxPublishPending,
    long IntegrationEventOutboxDeadLetter);
