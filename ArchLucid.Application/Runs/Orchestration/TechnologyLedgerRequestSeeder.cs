using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Seeds canonical Technology Ledger rows from an <see cref="ArchitectureRequest" /> after a run is created.
///     Best-effort only — failures are logged by the caller and must not fail run creation.
/// </summary>
public sealed class TechnologyLedgerRequestSeeder(
    ITechnologyLedgerRepository technologyLedgerRepository,
    TimeProvider timeProvider)
{
    private const string DraftIntakeRationale = "Explicit answer to the required target-cloud intake question.";

    private const string DirectRequestRationale =
        "Directly specified on ArchitectureRequest.CloudProvider by the request source.";

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <summary>
    ///     Builds the per-run <see cref="TechnologyLedgerRole.CloudPlatform" /> entry from request intake signals.
    /// </summary>
    public static TechnologyLedgerEntry BuildCloudPlatformEntry(
        string runId,
        ArchitectureRequest request,
        DateTime utcNow)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);

        return new TechnologyLedgerEntry
        {
            RunId = runId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = ResolveTechnologyName(request.CloudProvider),
            ProviderFamily = request.CloudProvider,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            Rationale = string.Equals(request.RequestSource, "draft-intake", StringComparison.Ordinal)
                ? DraftIntakeRationale
                : DirectRequestRationale,
            IsLocked = false,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
    }

    /// <summary>Persists the cloud-platform ledger entry for the given run.</summary>
    public async Task SeedAsync(string runId, ArchitectureRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);

        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        TechnologyLedgerEntry entry = BuildCloudPlatformEntry(runId, request, utcNow);

        await _technologyLedgerRepository.AddAsync(entry, cancellationToken);
    }

    private static string ResolveTechnologyName(CloudProvider provider) => provider switch
    {
        CloudProvider.Azure => "Microsoft Azure",
        CloudProvider.Aws => "Amazon Web Services",
        CloudProvider.Gcp => "Google Cloud Platform",
        _ => "Cloud-neutral (no specific provider)",
    };
}
