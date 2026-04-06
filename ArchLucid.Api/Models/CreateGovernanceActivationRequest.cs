using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class CreateGovernanceActivationRequest
{
    public string RunId { get; set; } = string.Empty;
    public string ManifestVersion { get; set; } = string.Empty;
    public string Environment { get; set; } = "dev";
}
