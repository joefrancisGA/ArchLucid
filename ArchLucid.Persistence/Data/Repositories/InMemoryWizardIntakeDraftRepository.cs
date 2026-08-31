using ArchLucid.Contracts.Intake;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="IWizardIntakeDraftRepository" /> for tests and
///     <see cref="ArchLucid.Core.Configuration.StorageProviderNames.InMemory" />.
/// </summary>
public sealed class InMemoryWizardIntakeDraftRepository : IWizardIntakeDraftRepository
{
    private readonly Lock _gate = new();
    private readonly Dictionary<string, WizardIntakeDraftResponse> _rows = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<WizardIntakeDraftResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        string wizardId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
            return Task.FromResult(_rows.GetValueOrDefault(Key(tenantId, workspaceId, wizardId)));
    }

    /// <inheritdoc />
    public Task UpsertAsync(
        Guid tenantId,
        Guid workspaceId,
        string wizardId,
        int stepIndex,
        string stateJson,
        byte[]? idempotencyKeyHash,
        DateTime updatedUtc,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);
        ArgumentNullException.ThrowIfNull(stateJson);
        _ = idempotencyKeyHash;
        cancellationToken.ThrowIfCancellationRequested();

        WizardIntakeDraftResponse row = new()
        {
            WizardId = wizardId,
            StepIndex = stepIndex,
            StateJson = stateJson,
            UpdatedUtc = updatedUtc,
        };

        lock (_gate)
            _rows[Key(tenantId, workspaceId, wizardId)] = row;

        return Task.CompletedTask;
    }

    private static string Key(Guid tenantId, Guid workspaceId, string wizardId) =>
        $"{tenantId:N}:{workspaceId:N}:{wizardId}";
}
