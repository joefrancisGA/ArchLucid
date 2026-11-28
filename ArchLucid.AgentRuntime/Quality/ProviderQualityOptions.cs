namespace ArchLucid.AgentRuntime.Quality;

public sealed class ProviderQualityOptions
{
    public const string SectionPath = "ArchLucid:Agents:ProviderQuality";

    // Enable only after the system-catalog migration is deployed and verified.
    public bool UseDurableState { get; set; }

    public bool Enabled { get; set; } = true;
    public bool EnforceQuarantine { get; set; } = true;
    public int MinimumIndependentKnownSamples { get; set; } = 30;
    public double MaximumWeightedBadRate { get; set; } = 0.35;
    public double MinimumWilsonBadRate { get; set; } = 0.20;
    public int QuarantineSeconds { get; set; } = 900;
    public int RecoveryProbeLeaseSeconds { get; set; } = 120;

    public void Normalize()
    {
        MinimumIndependentKnownSamples = Math.Clamp(MinimumIndependentKnownSamples, 5, 10_000);
        MaximumWeightedBadRate = Math.Clamp(MaximumWeightedBadRate, 0.01, 1.0);
        MinimumWilsonBadRate = Math.Clamp(MinimumWilsonBadRate, 0.0, 1.0);
        QuarantineSeconds = Math.Clamp(QuarantineSeconds, 30, 86_400);
        RecoveryProbeLeaseSeconds = Math.Clamp(RecoveryProbeLeaseSeconds, 10, 3_600);
    }
}
