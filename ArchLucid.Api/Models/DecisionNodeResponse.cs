using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class DecisionNodeResponse
{
    public List<DecisionNodeRecord> Decisions
    {
        get;
        set;
    } = [];
}
