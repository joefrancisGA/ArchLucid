using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>JSON body for <c>GET .../features/async-authority-pipeline</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed record AsyncAuthorityPipelineFeatureState(bool Enabled);
