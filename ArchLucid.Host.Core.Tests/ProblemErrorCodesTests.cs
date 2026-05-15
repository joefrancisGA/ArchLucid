using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProblemErrorCodesTests
{
    [Theory]
    [InlineData(null, ProblemErrorCodes.Unspecified)]
    [InlineData("", ProblemErrorCodes.Unspecified)]
    [InlineData("   ", ProblemErrorCodes.Unspecified)]
    [InlineData("https://unknown.example/nope", ProblemErrorCodes.Unspecified)]
    public void ResolveFromProblemType_maps_sentinel_and_unknown(string? type, string expected) =>
        ProblemErrorCodes.ResolveFromProblemType(type).Should().Be(expected);

    [Theory]
    [InlineData(ProblemTypes.RequestBodyRequired, ProblemErrorCodes.RequestBodyRequired)]
    [InlineData(ProblemTypes.ValidationFailed, ProblemErrorCodes.ValidationFailed)]
    [InlineData(ProblemTypes.RunNotFound, ProblemErrorCodes.RunNotFound)]
    [InlineData(ProblemTypes.ManifestNotFound, ProblemErrorCodes.ManifestNotFound)]
    [InlineData(ProblemTypes.AgentResultRequired, ProblemErrorCodes.AgentResultRequired)]
    [InlineData(ProblemTypes.CommitFailed, ProblemErrorCodes.CommitFailed)]
    [InlineData(ProblemTypes.UnavailableInProduction, ProblemErrorCodes.UnavailableInProduction)]
    [InlineData(ProblemTypes.InternalError, ProblemErrorCodes.InternalError)]
    [InlineData(ProblemTypes.BadRequest, ProblemErrorCodes.BadRequest)]
    [InlineData(ProblemTypes.ResourceNotFound, ProblemErrorCodes.ResourceNotFound)]
    [InlineData(ProblemTypes.InvalidRunState, ProblemErrorCodes.InvalidRunState)]
    [InlineData(ProblemTypes.DeterminismFailed, ProblemErrorCodes.DeterminismFailed)]
    [InlineData(ProblemTypes.ExportFailed, ProblemErrorCodes.ExportFailed)]
    [InlineData(ProblemTypes.ComparisonVerificationFailed, ProblemErrorCodes.ComparisonVerificationFailed)]
    [InlineData(ProblemTypes.Conflict, ProblemErrorCodes.Conflict)]
    [InlineData(ProblemTypes.QualityGateRejected, ProblemErrorCodes.QualityGateRejected)]
    [InlineData(ProblemTypes.PolicyPackVersionNotFound, ProblemErrorCodes.PolicyPackVersionNotFound)]
    [InlineData(ProblemTypes.DatabaseTimeout, ProblemErrorCodes.DatabaseTimeout)]
    [InlineData(ProblemTypes.DatabaseUnavailable, ProblemErrorCodes.DatabaseUnavailable)]
    [InlineData(ProblemTypes.BatchReplayAllFailed, ProblemErrorCodes.BatchReplayAllFailed)]
    [InlineData(ProblemTypes.CircuitBreakerOpen, ProblemErrorCodes.CircuitBreakerOpen)]
    [InlineData(ProblemTypes.LlmTokenQuotaExceeded, ProblemErrorCodes.LlmTokenQuotaExceeded)]
    [InlineData(ProblemTypes.GraphTooLargeForFullResponse, ProblemErrorCodes.GraphTooLargeForFullResponse)]
    [InlineData(ProblemTypes.RequestPayloadTooLarge, ProblemErrorCodes.RequestPayloadTooLarge)]
    [InlineData(ProblemTypes.CostLimitExceeded, ProblemErrorCodes.CostLimitExceeded)]
    [InlineData(ProblemTypes.GraphResolutionFailed, ProblemErrorCodes.GraphResolutionFailed)]
    [InlineData(ProblemTypes.UpstreamIntegrationFailed, ProblemErrorCodes.UpstreamIntegrationFailed)]
    [InlineData(ProblemTypes.ProvenanceNodeExplanationNotSupported, ProblemErrorCodes.ProvenanceNodeExplanationNotSupported)]
    [InlineData(ProblemTypes.TrialExpired, ProblemErrorCodes.TrialLimitExceeded)]
    public void ResolveFromProblemType_maps_known_types(string uri, string expected) =>
        ProblemErrorCodes.ResolveFromProblemType(uri).Should().Be(expected);

    [Fact]
    public void AttachErrorCode_sets_extension_and_throws_on_null_problem()
    {
        MvcProblemDetails problem = new();

        ProblemErrorCodes.AttachErrorCode(problem, ProblemTypes.RunNotFound);

        problem.Extensions["errorCode"].Should().Be(ProblemErrorCodes.RunNotFound);

        Action act = () => ProblemErrorCodes.AttachErrorCode(null!, ProblemTypes.RunNotFound);

        act.Should().Throw<ArgumentNullException>();
    }
}
