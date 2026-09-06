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

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_need_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption need not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption does not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption does not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption does not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption does not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption does not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_does_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption does not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cannot_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cannot have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_will_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption will not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_would_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption would not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_ought_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ought not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_should_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption should not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shall_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shall not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_must_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption must not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_teams_oughtnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "teams oughtn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_teams_oughtnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "teams oughtn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_teams_didnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "teams didn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_teams_wasnt_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "teams wasn't adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_use_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't use archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_have_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't have archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_adopt_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't adopt archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_enable_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't enable archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_implement_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't implement archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_deploy_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't deploy archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wasnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads wasn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_didnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads didn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_would_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads would not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_ought_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ought not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_should_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads should not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_will_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads will not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_need_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads need not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shall_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shall not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_must_not_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads must not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_maintain_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_ensure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_neednt_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads needn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_configure_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_mandate_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_apply_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_enforce_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_provision_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cannot_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads cannot require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_require_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_couldnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads couldn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_can_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_deploy_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not deploy encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_adopt_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not adopt encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_could_not_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads could not have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_enforce_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't enforce encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_maintain_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't maintain encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_ensure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't ensure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't apply encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_doesnt_need_to_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads doesn't need to encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_provision_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't provision encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_have_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't have encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_enable_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't enable encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_dont_implement_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads don't implement encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_require_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not require encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_need_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not need encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_configure_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not configure encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_mandate_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not mandate encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_apply_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not apply encryption at rest")
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
