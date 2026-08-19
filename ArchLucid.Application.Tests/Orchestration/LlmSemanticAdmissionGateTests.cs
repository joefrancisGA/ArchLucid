using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmSemanticAdmissionGateTests
{
    private readonly LlmSemanticAdmissionGate _sut = new();

    [Fact]
    public async Task EvaluateAsync_k6_ci_smoke_description_without_domain_terms_is_rejected()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "k6-ci-2-0-1718384009123",
            Description = "k6 CI smoke write-path test",
            SystemName = "K6CiSmokeSystem",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        RequestContentSafetyResult result = await _sut.EvaluateAsync(request, CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Reasons.Should().NotBeEmpty();
    }

    [Fact]
    public async Task EvaluateAsync_k6_ci_smoke_description_with_architecture_term_is_allowed()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "k6-ci-2-0-1718384009123",
            Description = "k6 CI smoke architecture write-path test",
            SystemName = "K6CiSmokeSystem",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        RequestContentSafetyResult result = await _sut.EvaluateAsync(request, CancellationToken.None);

        result.IsAllowed.Should().BeTrue();
        result.Reasons.Should().BeEmpty();
    }
}
