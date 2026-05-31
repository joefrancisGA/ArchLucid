namespace ArchLucid.Host.Core.Hosted;

public sealed class ArchitectureReviewRecurrenceHostedServiceOptions
{
    public const string SectionName = "ArchLucid:ArchitectureReviewRecurrence";

    public TimeSpan PollInterval
    {
        get;
        set;
    } = TimeSpan.FromMinutes(10);
}
