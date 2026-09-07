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
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_does_not_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads does not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_wont_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads won't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shouldnt_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shouldn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_required_to_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not required to provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_is_not_needed_to_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads is not needed to need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mustnt_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mustn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_do_not_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads do not need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_shant_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads shan't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_darent_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads daren't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_maynt_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mayn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_oughtnt_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads oughtn't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_aint_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads ain't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_maintain_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't maintain to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_ensure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't ensure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_require_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't require to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_cant_need_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads can't need to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_configure_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't configure to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_mandate_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't mandate to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_apply_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't apply to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_enforce_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't enforce to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_workloads_mightnt_provision_to_use_encryption_at_rest_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "workloads mightn't provision to use encryption at rest")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shan't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption daren't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption ain't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mayn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption needn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aren't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption haven't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadn't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption weren't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_could_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption could not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_can_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption can not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_might_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption might not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_may_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption may not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dare_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dare not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_is_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption is not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_was_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption was not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_are_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption are not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_were_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption were not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_has_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption has not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_have_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption have not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_had_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption had not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_did_not_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption did not need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption don't need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wont_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wont need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_dont_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption dont need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_doesnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption doesnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_cant_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption cant need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_couldnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption couldnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wouldnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wouldnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shouldnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shouldnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mightnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mightnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_shant_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption shant need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_aint_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption aint need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_havent_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption havent need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werent_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werent need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arent_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arent need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_darent_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption darent need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_maynt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption maynt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_oughtnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption oughtnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnt_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnt need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_neednot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption neednot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_mustnot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption mustnot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_donot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption donot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_didnot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption didnot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hadnot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hadnot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_hasnot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption hasnot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_wasnot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption wasnot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_isnot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption isnot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_arenot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption arenot need archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_configure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot configure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_mandate_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot mandate archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_apply_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot apply archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_enforce_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot enforce archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_maintain_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot maintain archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_ensure_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot ensure archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_provision_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot provision archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_require_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot require archived blob keys")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsObviousGenericAdvice_does_not_flag_werenot_unquoted_need_suffix_phrasing()
    {
        GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(
                "enable encryption werenot need archived blob keys")
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
