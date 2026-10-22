using ArchLucid.Application.Admin;
using ArchLucid.Contracts.Admin;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentComponentAgreementEvaluatorTests
{
    [Fact]
    public void Evaluate_when_all_match_returns_Match()
    {
        (string agreement, string detail) = DeploymentComponentAgreementEvaluator.Evaluate("abc", "abc", "abc");

        agreement.Should().Be(AdminDeploymentStatusValues.AgreementMatch);
        detail.Should().Contain("match");
    }

    [Fact]
    public void Evaluate_when_api_and_frontend_disagree_returns_Mismatch()
    {
        (string agreement, string _) = DeploymentComponentAgreementEvaluator.Evaluate("aaa", "bbb", "Unknown");

        agreement.Should().Be(AdminDeploymentStatusValues.AgreementMismatch);
    }

    [Fact]
    public void Evaluate_when_known_agree_but_worker_missing_returns_Partial()
    {
        (string agreement, string _) = DeploymentComponentAgreementEvaluator.Evaluate("abc", "abc", null);

        agreement.Should().Be(AdminDeploymentStatusValues.AgreementPartial);
    }

    [Fact]
    public void Evaluate_when_all_missing_returns_Unknown()
    {
        (string agreement, string _) = DeploymentComponentAgreementEvaluator.Evaluate(null, "unknown", "");

        agreement.Should().Be(AdminDeploymentStatusValues.Unknown);
    }
}
