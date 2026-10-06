using ArchLucid.Api.Http.Governance;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    private static bool TryParseGovernanceRunIdFromBody(string raw, out string normalizedRunId) =>
        GovernanceRunIdHttpParser.TryParseFromBody(raw, out normalizedRunId);
}
