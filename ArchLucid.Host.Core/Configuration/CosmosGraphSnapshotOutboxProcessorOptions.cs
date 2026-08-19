namespace ArchLucid.Host.Core.Configuration;

/// <summary>Background drain settings for <c>dbo.CosmosGraphSnapshotOutbox</c>.</summary>
public sealed class CosmosGraphSnapshotOutboxProcessorOptions : IOutboxLeaseRetryProcessorOptions
{
    public const string SectionName = "CosmosGraphSnapshotOutbox";

    public int LeaseDurationSeconds { get; set; } = 300;

    public int MaxAttemptsBeforeDeadLetter { get; set; } = 8;

    public int RetryBackoffBaseSeconds { get; set; } = 30;

    public int RetryBackoffMaxSeconds { get; set; } = 900;

    /// <summary>Maximum idle poll delay (seconds) when the outbox is empty; first empty poll uses <see cref="Hosted.AdaptiveOutboxIdleBackoff.BaseIdleDelay" /> then backs off to this ceiling.</summary>
    public int PollIntervalSeconds { get; set; } = 15;
}
