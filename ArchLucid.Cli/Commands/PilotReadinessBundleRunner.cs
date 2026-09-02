using ArchLucid.Cli.Commands.PilotReadiness;

namespace ArchLucid.Cli.Commands;

internal sealed class PilotReadinessBundleRunner
{
    private readonly IReadOnlyList<IPilotReadinessSlotRunner> _slotRunners;

    internal PilotReadinessBundleRunner()
        : this(CreateDefaultSlotRunners())
    {
    }

    internal PilotReadinessBundleRunner(IReadOnlyList<IPilotReadinessSlotRunner> slotRunners)
    {
        _slotRunners = slotRunners ?? throw new ArgumentNullException(nameof(slotRunners));
    }

    internal async Task<PilotReadinessBundleReport> RunAsync(
        string repositoryRoot,
        PilotReadinessBundleOptions options,
        HttpClient? httpClient,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string[] rawArgs,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(rawArgs);

        PilotReadinessSlotRunContext context = new()
        {
            RepositoryRoot = repositoryRoot,
            Options = options,
            HttpClient = httpClient,
            Config = config,
            RawArgs = rawArgs,
        };

        List<PilotReadinessBundleSlotResult> slots = new(capacity: _slotRunners.Count);

        foreach (IPilotReadinessSlotRunner slotRunner in _slotRunners)
            slots.Add(await slotRunner.RunAsync(context, cancellationToken));

        return new PilotReadinessBundleReport
        {
            RepositoryRoot = repositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            RunId = string.IsNullOrWhiteSpace(options.RunId) ? null : options.RunId.Trim(),
            OverallVerdict = PilotReadinessBundleVerdictRollup.FromSlots(slots),
            Slots = slots,
        };
    }

    private static IReadOnlyList<IPilotReadinessSlotRunner> CreateDefaultSlotRunners() =>
    [
        new BuyerProofEvidenceLedgerSlotRunner(),
        new ReturnTriggerTelemetrySlotRunner(),
        new DecisionOwnerScoreboardSlotRunner(),
        new FrontierAiBaselineSlotRunner(),
        new CitationIntegritySlotRunner(),
        new TenantIsolationSlotRunner(),
        new ItsmPullForwardSlotRunner(),
        new ShipGateEvidenceSlotRunner(),
    ];
}
