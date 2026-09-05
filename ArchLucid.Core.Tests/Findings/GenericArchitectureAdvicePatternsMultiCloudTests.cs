using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class GenericArchitectureAdvicePatternsMultiCloudTests
{
    [Theory]
    [InlineData("Enable GuardDuty for threat detection across the account.")]
    [InlineData("Use CloudTrail to capture management events.")]
    [InlineData("Enable Security Hub for centralized findings.")]
    [InlineData("Store secrets in AWS Secrets Manager.")]
    [InlineData("Enable S3 public access block on all buckets.")]
    public void IsObviousGenericAdvice_flags_aws_checklist_phrasing(string message)
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message).Should().BeTrue();
    }

    [Theory]
    [InlineData("Enable Cloud Audit Logs for admin activity.")]
    [InlineData("Use Security Command Center for posture management.")]
    [InlineData("Encrypt data with Cloud KMS customer-managed keys.")]
    [InlineData("Apply VPC Service Controls around sensitive services.")]
    [InlineData("Use Secret Manager for application credentials.")]
    public void IsObviousGenericAdvice_flags_gcp_checklist_phrasing(string message)
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message).Should().BeTrue();
    }

    [Theory]
    [InlineData("Implement network policies to restrict pod traffic.")]
    [InlineData("Enable pod security admission for the namespace.")]
    [InlineData("Set resource limits and requests on every deployment.")]
    [InlineData("Run containers with a read-only root filesystem.")]
    [InlineData("Enable image scanning in the container registry.")]
    public void IsObviousGenericAdvice_flags_kubernetes_checklist_phrasing(string message)
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message).Should().BeTrue();
    }

    [Theory]
    [InlineData("do not enable mfa for service accounts")]
    [InlineData("misuse https only for legacy clients")]
    [InlineData("no requirement to enable mfa for this workload")]
    [InlineData("never enable mfa for service accounts")]
    [InlineData("not required to enable mfa for this workload")]
    [InlineData("workload without enable mfa for service accounts")]
    [InlineData("policy avoids enable mfa for batch workloads")]
    [InlineData("enable mfa not required for batch service accounts")]
    [InlineData("no need to enable mfa for this workload")]
    [InlineData("enable mfa not necessary for batch workloads")]
    [InlineData("use https is optional for legacy clients")]
    [InlineData("enable mfa is not necessary for batch workloads")]
    [InlineData("use https is unnecessary for legacy clients")]
    [InlineData("doesn't need to enable mfa for service accounts")]
    [InlineData("shouldn't enable mfa for service accounts")]
    [InlineData("won't need to enable mfa for service accounts")]
    [InlineData("enable mfa isn't required for batch workloads")]
    [InlineData("use https isn't needed for legacy clients")]
    public void IsObviousGenericAdvice_does_not_flag_negated_checklist_phrasing(string message)
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message).Should().BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_require_mid_sentence_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "This workload doesn't require enable tls for internal hops.")
            .Should()
            .BeFalse();
    }

    [Theory]
    [InlineData("enable mfa won't need to be configured for batch workloads")]
    [InlineData("use https must not be required for legacy clients")]
    public void IsObviousGenericAdvice_does_not_flag_wont_need_or_must_not_suffix_phrasing(string message)
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message).Should().BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_negated_checklist_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa cannot require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa need not be configured for batch workloads")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa will not require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa would not require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa would not need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa will not need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa ought not require hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_required_for_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa is not required for hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa need not adopt hardware tokens")
            .Should()
            .BeFalse();
    }

    [Theory]
    [InlineData(
        "Enable GuardDuty monitoring for `payments-api` ingress paths.",
        "subscriptions/000/resourceGroups/rg/providers/Microsoft.Web/sites/payments-api")]
    [InlineData(
        "Use CloudTrail on PaymentsApi to audit admin changes.",
        "PaymentsApi")]
    [InlineData(
        "Apply network policies to `checkout-worker` pods in namespace checkout.",
        "`checkout-worker`")]
    public void HasArchitectureSpecificAnchor_prevents_generic_flag_when_element_named(
        string message,
        string evidenceRef)
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(message).Should().BeTrue();
        GenericArchitectureAdvicePatterns.HasArchitectureSpecificAnchor(message, [evidenceRef]).Should().BeTrue();
    }

    [Fact]
    public void Deterministic_gate_does_not_demote_when_architecture_anchor_present()
    {
        IInsightDensityGate gate = DeterministicInsightDensityGate.CreateDefault();
        InsightDensityGateCandidate candidate = new(
            "aws-f1",
            "Enable GuardDuty monitoring for `payments-api` ingress paths.",
            ["`payments-api`"],
            Contracts.Findings.FindingSeverity.Warning,
            category: "Security",
            isAgentArchitectureFinding: true);

        InsightDensityGateResult result = gate.Score(candidate, [candidate]);

        result.Treatment.Should().Be(Contracts.Findings.FindingTreatment.Promote);
        result.Classification.Should().Be(Contracts.Findings.FindingClassification.DecisionGradeFinding);
    }
}
