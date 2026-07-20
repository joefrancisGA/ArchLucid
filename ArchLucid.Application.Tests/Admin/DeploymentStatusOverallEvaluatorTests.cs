using ArchLucid.Application.Admin;
using ArchLucid.Contracts.Admin;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentStatusOverallEvaluatorTests
{
    [Fact]
    public void Evaluate_healthy_when_ready_and_match()
    {
        (string status, string label) = DeploymentStatusOverallEvaluator.Evaluate(
            "Healthy",
            "Healthy",
            AdminDeploymentStatusValues.AgreementMatch);

        status.Should().Be(AdminDeploymentStatusValues.OverallHealthy);
        label.Should().Contain("Healthy");
    }

    [Fact]
    public void Evaluate_failed_on_mismatch_even_when_health_ok()
    {
        (string status, string label) = DeploymentStatusOverallEvaluator.Evaluate(
            "Healthy",
            "Healthy",
            AdminDeploymentStatusValues.AgreementMismatch);

        status.Should().Be(AdminDeploymentStatusValues.OverallFailed);
        label.Should().Contain("Failed");
    }

    [Fact]
    public void Evaluate_warning_when_agreement_unknown()
    {
        (string status, string _) = DeploymentStatusOverallEvaluator.Evaluate(
            "Healthy",
            "Healthy",
            AdminDeploymentStatusValues.Unknown);

        status.Should().Be(AdminDeploymentStatusValues.OverallWarning);
    }
}
