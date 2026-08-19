using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.TechnologyLedger;

public sealed class TechnologyLedgerRunCommandService(
    ITechnologyLedgerRepository technologyLedgerRepository,
    IRunRepository runRepository,
    TimeProvider timeProvider) : ITechnologyLedgerRunCommandService
{
    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        string runIdKey = await EnsureRunExistsAsync(scope, runId, cancellationToken);

        return await _technologyLedgerRepository.GetByRunIdAsync(scope, runIdKey, cancellationToken);
    }

    public async Task<TechnologyLedgerEntry> PatchEntryAsync(
        ScopeContext scope,
        Guid runId,
        string entryId,
        PatchTechnologyLedgerEntryCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(entryId);
        ArgumentNullException.ThrowIfNull(command);

        if (!command.HasChanges())
            throw new TechnologyLedgerPatchValidationException("At least one patch field must be provided.");

        string runIdKey = await EnsureRunExistsAsync(scope, runId, cancellationToken);
        IReadOnlyList<TechnologyLedgerEntry> existingRows =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runIdKey, cancellationToken);

        TechnologyLedgerEntry existing = existingRows.FirstOrDefault(row => string.Equals(row.EntryId, entryId, StringComparison.Ordinal))
            ?? throw new TechnologyLedgerEntryNotFoundException(runIdKey, entryId);

        string? normalizedTechnologyName = command.TechnologyName is null
            ? null
            : command.TechnologyName.Trim();

        if (normalizedTechnologyName is { Length: 0 })
            throw new TechnologyLedgerPatchValidationException("TechnologyName cannot be empty when provided.");

        string? normalizedRationale = command.Rationale?.Trim();

        bool statusChanging = command.Status.HasValue && command.Status.Value != existing.Status;
        bool technologyNameChanging = normalizedTechnologyName is not null
            && !string.Equals(normalizedTechnologyName, existing.TechnologyName, StringComparison.Ordinal);
        bool providerFamilyChanging = command.ProviderFamily.HasValue
            && command.ProviderFamily.Value != existing.ProviderFamily;

        if (existing.IsLocked && (statusChanging || technologyNameChanging || providerFamilyChanging))
        {
            throw new TechnologyLedgerPatchValidationException(
                "Locked Technology Ledger entries cannot change Status, TechnologyName, or ProviderFamily.");
        }

        DateTime updatedUtc = _timeProvider.GetUtcNow().UtcDateTime;
        TechnologyLedgerStatus nextStatus = command.Status ?? existing.Status;

        if (nextStatus == TechnologyLedgerStatus.Chosen && existing.Status != TechnologyLedgerStatus.Chosen)
        {
            foreach (TechnologyLedgerEntry otherChosen in existingRows.Where(
                         row => row.Role == existing.Role
                             && row.Status == TechnologyLedgerStatus.Chosen
                             && !string.Equals(row.EntryId, entryId, StringComparison.Ordinal)))
            {
                TechnologyLedgerEntry demoted = CloneEntry(otherChosen);
                demoted.Status = TechnologyLedgerStatus.Alternative;
                demoted.UpdatedUtc = updatedUtc;
                await _technologyLedgerRepository.UpdateAsync(demoted, cancellationToken);
            }
        }

        TechnologyLedgerEntry updated = CloneEntry(existing);

        if (command.Status.HasValue)
            updated.Status = command.Status.Value;

        if (command.IsLocked.HasValue)
            updated.IsLocked = command.IsLocked.Value;

        if (normalizedRationale is not null)
            updated.Rationale = normalizedRationale;

        if (normalizedTechnologyName is not null)
            updated.TechnologyName = normalizedTechnologyName;

        if (command.ProviderFamily.HasValue)
            updated.ProviderFamily = command.ProviderFamily.Value;

        if (existing.Status == TechnologyLedgerStatus.Assumed && updated.Status == TechnologyLedgerStatus.Chosen)
            updated.Source = TechnologyLedgerSource.User;

        updated.UpdatedUtc = updatedUtc;
        await _technologyLedgerRepository.UpdateAsync(updated, cancellationToken);

        return updated;
    }

    private async Task<string> EnsureRunExistsAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId.ToString("N"));

        return runId.ToString("N");
    }

    private static TechnologyLedgerEntry CloneEntry(TechnologyLedgerEntry source) =>
        new()
        {
            EntryId = source.EntryId,
            RunId = source.RunId,
            Role = source.Role,
            TechnologyName = source.TechnologyName,
            ProviderFamily = source.ProviderFamily,
            Status = source.Status,
            Source = source.Source,
            EvidenceRef = source.EvidenceRef,
            Rationale = source.Rationale,
            IsLocked = source.IsLocked,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = source.UpdatedUtc,
        };
}
