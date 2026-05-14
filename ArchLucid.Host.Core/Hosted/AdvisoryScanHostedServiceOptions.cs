using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Background poller cadence for <see cref="AdvisoryScanHostedService"/>.</summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with defaults only; exercised via host registration.")]
public sealed class AdvisoryScanHostedServiceOptions
{
    public const string SectionName = "AdvisoryScanHostedService";

    /// <summary>Delay between due-schedule poll iterations when the leader loop is running.</summary>
    public TimeSpan PollInterval
    {
        get;
        set;
    } = TimeSpan.FromMinutes(5);
}
