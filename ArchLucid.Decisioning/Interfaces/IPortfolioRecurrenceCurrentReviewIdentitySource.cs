namespace ArchLucid.Decisioning.Interfaces;

/// <summary>
///     Supplies stable finding identities from the in-flight orchestration pass so
///     <c>portfolio-recurrence</c> can match the current review before its snapshot is persisted.
/// </summary>
public interface IPortfolioRecurrenceCurrentReviewIdentitySource
{
    IReadOnlyCollection<string> GetIdentities();

    void SetIdentities(IReadOnlyCollection<string> identities);
}
