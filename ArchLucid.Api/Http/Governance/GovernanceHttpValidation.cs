namespace ArchLucid.Api.Http.Governance;

/// <summary>Validation outcome for governance HTTP mappers (controllers map to Problem Details).</summary>
public sealed record GovernanceHttpValidation(string Message, string ProblemType);
