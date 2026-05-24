using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class AgentEvidencePackageResponse
{
    public AgentEvidencePackage Evidence
    {
        get;
        set;
    } = new();
}
