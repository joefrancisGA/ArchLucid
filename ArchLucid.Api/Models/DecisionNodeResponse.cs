using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Decisions;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class DecisionNodeResponse
{
    public List<DecisionNode> Decisions { get; set; } = [];
}

