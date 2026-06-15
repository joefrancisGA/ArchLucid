using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Runs multiple <see cref="IRequestContentSafetyPrecheck"/> implementations in sequence.
///     If any precheck fails, the request is rejected with the combined reasons.
/// </summary>
public sealed class CompositeRequestContentSafetyPrecheck(IEnumerable<IRequestContentSafetyPrecheck> prechecks) : IRequestContentSafetyPrecheck
{
    private readonly IReadOnlyList<IRequestContentSafetyPrecheck> _prechecks = prechecks.ToList();

    public async Task<RequestContentSafetyResult> EvaluateAsync(ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<string> allReasons = [];

        foreach (IRequestContentSafetyPrecheck precheck in _prechecks)
        {
            RequestContentSafetyResult result = await precheck.EvaluateAsync(request, cancellationToken);
            if (!result.IsAllowed)
            {
                allReasons.AddRange(result.Reasons);
            }
        }

        return new RequestContentSafetyResult { IsAllowed = allReasons.Count == 0, Reasons = allReasons };
    }
}
