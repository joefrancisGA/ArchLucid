using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class CommitRunResponse
{
    public GoldenManifest Manifest
    {
        get;
        set;
    } = new();

    public List<DecisionTraceDto> DecisionTraces
    {
        get;
        set;
    } = [];

    public List<string> Warnings
    {
        get;
        set;
    } = [];
}
