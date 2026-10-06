using ArchLucid.Application.Governance;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    private static bool TryParseGovernanceRunIdFromBody(string raw, out string normalizedRunId)
    {
        normalizedRunId = GovernanceRunIdNormalizer.Normalize(raw);
        return Guid.TryParse(normalizedRunId, out Guid parsedRunId) && parsedRunId != Guid.Empty;
    }
}
