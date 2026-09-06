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

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa ought not need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa cannot need hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa will not mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa would not mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not apply hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not provision hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa ought not mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa will not enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa would not enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not ensure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa ought not enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa will not configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa would not configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa does not maintain hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa ought not configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not apply hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not apply hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa cannot mandate hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa shall not provision hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa should not provision hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa cannot configure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa need not maintain hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa would not provision hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa cannot provision hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa cannot enforce hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable mfa need not ensure hardware tokens")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not apply to archived blobs")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot apply to archived blobs")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not apply to archived blobs")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not apply to archived blobs")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not apply to archived blobs")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_do_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption do not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldn't have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption won't have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not use archived blob keys")
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
