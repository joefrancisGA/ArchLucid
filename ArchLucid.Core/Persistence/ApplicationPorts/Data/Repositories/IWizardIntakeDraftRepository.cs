using ArchLucid.Contracts.Intake;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads and writes <c>dbo.WizardIntakeDrafts</c> for tenant/workspace-scoped wizard intake drafts.</summary>
public interface IWizardIntakeDraftRepository
{
    /// <summary>Returns the draft for the scope/wizard pair, or null when no row exists.</summary>
    Task<WizardIntakeDraftResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        string wizardId,
        CancellationToken cancellationToken);

    /// <summary>Inserts or updates the draft for the scope/wizard pair.</summary>
    Task UpsertAsync(
        Guid tenantId,
        Guid workspaceId,
        string wizardId,
        int stepIndex,
        string stateJson,
        byte[]? idempotencyKeyHash,
        DateTime updatedUtc,
        CancellationToken cancellationToken);
}
