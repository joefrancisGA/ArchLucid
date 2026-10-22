using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Findings;

/// <inheritdoc />
public sealed class PortfolioRecurrenceCurrentReviewIdentitySource : IPortfolioRecurrenceCurrentReviewIdentitySource
{
    private IReadOnlyCollection<string> _identities = Array.AsReadOnly(Array.Empty<string>());

    public IReadOnlyCollection<string> GetIdentities() => _identities;

    public void SetIdentities(IReadOnlyCollection<string> identities) =>
        _identities = Array.AsReadOnly(System.Linq.Enumerable.ToArray(identities ?? throw new ArgumentNullException(nameof(identities))));
}
