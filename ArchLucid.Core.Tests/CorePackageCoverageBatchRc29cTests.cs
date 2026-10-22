using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Alerts.Composite;
using ArchLucid.Core.Identity;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>RC29c package-coverage batch: identity issuer normalization and composite alert dedupe keys.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc29cTests
{
    [Theory]
    [InlineData("https://accounts.google.com/", "https://accounts.google.com")]
    [InlineData("  HTTPS://LOGIN.MICROSOFTONLINE.COM/tenant/v2.0/ ", "https://login.microsoftonline.com/tenant/v2.0")]
    public void IdentityIssuerNormalizer_Normalize_trims_and_lowercases(string issuer, string expected)
    {
        IdentityIssuerNormalizer.Normalize(issuer).Should().Be(expected);
    }

    [Fact]
    public void IdentityIssuerNormalizer_NormalizeMicrosoftEntraIssuer_builds_v2_issuer_url()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        string issuer = IdentityIssuerNormalizer.NormalizeMicrosoftEntraIssuer(tenantId);

        issuer.Should().Be($"https://login.microsoftonline.com/{tenantId:D}/v2.0");
    }

    [Fact]
    public void IdentityIssuerConstants_exposes_canonical_issuer_tokens()
    {
        IdentityIssuerConstants.TrialLocalPassword.Should().Be("archlucid:trial-local");
        IdentityIssuerConstants.EmailOneTimeCode.Should().Be("archlucid:email-otp");
        IdentityIssuerConstants.GoogleAccountsIssuer.Should().Contain("google.com");
        IdentityIssuerConstants.MicrosoftLoginOnlinePrefix.Should().Contain("microsoftonline.com");
        IdentityIssuerConstants.MicrosoftLoginOnlineSuffix.Should().Be("/v2.0");
    }

    [Fact]
    public void CompositeAlertDeduplicationKeyBuilder_builds_scope_specific_keys()
    {
        Guid compositeRuleId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid comparedRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        AlertEvaluationContext context = new()
        {
            RunId = runId,
            ComparedToRunId = comparedRunId,
        };

        CompositeAlertDeduplicationKeyBuilder.Build(
            new CompositeAlertRule { CompositeRuleId = compositeRuleId, DedupeScope = CompositeDedupeScope.RuleOnly },
            context)
            .Should()
            .Be($"composite:{compositeRuleId:D}");

        CompositeAlertDeduplicationKeyBuilder.Build(
            new CompositeAlertRule { CompositeRuleId = compositeRuleId, DedupeScope = CompositeDedupeScope.RuleAndRun },
            context)
            .Should()
            .Be($"composite:{compositeRuleId:D}:run:{runId:D}");

        CompositeAlertDeduplicationKeyBuilder.Build(
            new CompositeAlertRule
            {
                CompositeRuleId = compositeRuleId,
                DedupeScope = CompositeDedupeScope.RuleAndComparison,
            },
            context)
            .Should()
            .Be($"composite:{compositeRuleId:D}:run:{runId:D}:compare:{comparedRunId:D}");
    }

    [Fact]
    public void CompositeAlertDeduplicationKeyBuilder_throws_when_arguments_null()
    {
        CompositeAlertRule rule = new();
        AlertEvaluationContext context = new();

        FluentActions
            .Invoking(() => CompositeAlertDeduplicationKeyBuilder.Build(null!, context))
            .Should()
            .Throw<ArgumentNullException>();

        FluentActions
            .Invoking(() => CompositeAlertDeduplicationKeyBuilder.Build(rule, null!))
            .Should()
            .Throw<ArgumentNullException>();
    }
}
