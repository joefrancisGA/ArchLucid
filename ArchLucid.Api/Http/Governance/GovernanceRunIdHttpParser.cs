using ArchLucid.Application.Governance;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Parses governance run ids from HTTP bodies and routes using <see cref="GovernanceRunIdNormalizer" />.</summary>
public static class GovernanceRunIdHttpParser
{
    public static bool TryParseFromBody(string raw, out string normalizedRunId)
    {
        normalizedRunId = GovernanceRunIdNormalizer.Normalize(raw);
        return Guid.TryParse(normalizedRunId, out Guid parsedRunId) && parsedRunId != Guid.Empty;
    }
}
