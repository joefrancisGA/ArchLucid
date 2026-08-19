using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Hard-deletes expired terminal intake drafts (ADR 0048).</summary>
public interface IDraftIntakeReaperService
{
    Task<DraftIntakeReaperResult> PurgeExpiredTerminalDraftsAsync(
        DateTimeOffset updatedBeforeUtc,
        CancellationToken cancellationToken);
}
