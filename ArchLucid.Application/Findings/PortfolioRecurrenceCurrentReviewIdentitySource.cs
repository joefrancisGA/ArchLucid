using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Findings;

/// <inheritdoc />
public sealed class PortfolioRecurrenceCurrentReviewIdentitySource : IPortfolioRecurrenceCurrentReviewIdentitySource
{
    private IReadOnlyCollection<string> _identities = Array.Empty<string>();

    public IReadOnlyCollection<string> GetIdentities() => _identities;

    public void SetIdentities(IReadOnlyCollection<string> identities) =>
        _identities = identities ?? throw new ArgumentNullException(nameof(identities));
}
