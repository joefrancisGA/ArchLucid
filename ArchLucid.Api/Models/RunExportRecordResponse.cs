using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunExportRecordResponse
{
    public RunExportRecord Record
    {
        get;
        set;
    } = new();
}
