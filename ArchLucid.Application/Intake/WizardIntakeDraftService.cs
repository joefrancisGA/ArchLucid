using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Intake;

public interface IWizardIntakeDraftService
{
    Task<WizardIntakeDraftResponse?> GetAsync(ScopeContext scope, string wizardId, CancellationToken cancellationToken);

    Task<WizardIntakeDraftResponse> UpsertAsync(
        ScopeContext scope,
        string wizardId,
        UpsertWizardIntakeDraftRequest request,
        CancellationToken cancellationToken);
}

public sealed class WizardIntakeDraftService(
    IWizardIntakeDraftRepository repository,
    TimeProvider timeProvider) : IWizardIntakeDraftService
{
    private readonly IWizardIntakeDraftRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public Task<WizardIntakeDraftResponse?> GetAsync(
        ScopeContext scope,
        string wizardId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);

        string trimmedWizardId = wizardId.Trim();
        if (trimmedWizardId.Length > 128)
            throw new ArgumentException("wizardId must be <= 128 characters.", nameof(wizardId));

        return _repository.GetAsync(scope.TenantId, scope.WorkspaceId, trimmedWizardId, cancellationToken);
    }

    public async Task<WizardIntakeDraftResponse> UpsertAsync(
        ScopeContext scope,
        string wizardId,
        UpsertWizardIntakeDraftRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);

        if (string.IsNullOrWhiteSpace(request.StateJson))
            throw new ArgumentException("stateJson is required.", nameof(request.StateJson));

        if (request.StepIndex < 0)
            throw new ArgumentException("stepIndex must be >= 0.", nameof(request.StepIndex));

        try
        {
            using System.Text.Json.JsonDocument _ = System.Text.Json.JsonDocument.Parse(request.StateJson);
        }
        catch (System.Text.Json.JsonException)
        {
            throw new ArgumentException("stateJson must be valid JSON.", nameof(request.StateJson));
        }

        DateTime updatedUtc = _timeProvider.GetUtcNow().UtcDateTime;
        byte[]? idempotencyHash = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? null
            : ArchitectureRunIdempotencyHashing.HashIdempotencyKey(request.IdempotencyKey.Trim());

        string trimmedWizardId = wizardId.Trim();
        await _repository.UpsertAsync(
            scope.TenantId,
            scope.WorkspaceId,
            trimmedWizardId,
            request.StepIndex,
            request.StateJson,
            idempotencyHash,
            updatedUtc,
            cancellationToken).ConfigureAwait(false);

        return new WizardIntakeDraftResponse
        {
            WizardId = trimmedWizardId,
            StepIndex = request.StepIndex,
            StateJson = request.StateJson,
            UpdatedUtc = updatedUtc,
        };
    }
}
