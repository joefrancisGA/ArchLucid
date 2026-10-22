using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures policy-pack version inputs share one normalized semver value between validation and facade forwarding.
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerVersionNormalizationMatrixTests
{
    private static readonly Guid PackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static TheoryData<string, string> NormalizedVersionSamples =>
        new()
        {
            { " 1.0.0 ", "1.0.0" },
            { "\t1.0.0\t", "1.0.0" },
            { " v1.0.0 ", "v1.0.0" },
        };

    /// <summary>Raw label length can exceed 50 when padding is trimmed (parity with promote/get-version).</summary>
    public static TheoryData<string, string> PaddedVersionBeyondRawMaxLengthSamples =>
        new()
        {
            { new string(' ', 46) + "1.0.0", "1.0.0" },
        };

    [Theory]
    [MemberData(nameof(NormalizedVersionSamples))]
    public async Task GetVersion_forwards_normalized_pack_version_to_facade(string rawVersion, string expectedVersion)
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.GetVersionAsync(PackId, expectedVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersionHttpResult
            {
                Outcome = PolicyPackVersionLookupOutcome.Found,
                PolicyPackId = PackId,
                PackVersion = expectedVersion,
                Version = new PolicyPackVersion { PolicyPackId = PackId, Version = expectedVersion },
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.GetVersion(PackId, rawVersion, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        httpFacade.VerifyAll();
    }

    [Theory]
    [MemberData(nameof(PaddedVersionBeyondRawMaxLengthSamples))]
    public async Task Publish_accepts_padded_version_when_trimmed_label_is_within_limit(
        string rawVersion,
        string expectedVersion)
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.PublishVersionAsync(
                PackId,
                It.Is<PolicyPackPublishBody>(body =>
                    body.Version == expectedVersion
                    && body.ContentJson == """{"complianceRuleIds":[]}"""),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackVersion>
            {
                Outcome = PolicyPackHttpOutcome.Success,
                Value = new PolicyPackVersion { PolicyPackId = PackId, Version = expectedVersion },
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        PublishPolicyPackVersionRequest request = new()
        {
            Version = rawVersion,
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        IActionResult result = await sut.Publish(PackId, request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        httpFacade.VerifyAll();
    }

    [Theory]
    [MemberData(nameof(NormalizedVersionSamples))]
    public async Task Publish_forwards_normalized_version_to_facade(string rawVersion, string expectedVersion)
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.PublishVersionAsync(
                PackId,
                It.Is<PolicyPackPublishBody>(body =>
                    body.Version == expectedVersion
                    && body.ContentJson == """{"complianceRuleIds":[]}"""),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackVersion>
            {
                Outcome = PolicyPackHttpOutcome.Success,
                Value = new PolicyPackVersion { PolicyPackId = PackId, Version = expectedVersion },
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        PublishPolicyPackVersionRequest request = new()
        {
            Version = rawVersion,
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        IActionResult result = await sut.Publish(PackId, request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        httpFacade.VerifyAll();
    }

    [Theory]
    [MemberData(nameof(NormalizedVersionSamples))]
    public async Task PromoteCatalogEntry_forwards_normalized_optional_version_to_facade(
        string rawVersion,
        string expectedVersion)
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.PromoteCatalogEntryAsync(
                It.Is<PolicyPackPromoteCatalogBody>(body =>
                    body.SourcePolicyPackId == PackId
                    && body.Version == expectedVersion),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackCatalogEntryDetail>
            {
                Outcome = PolicyPackHttpOutcome.Success,
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = PackId,
                Version = rawVersion,
            },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        httpFacade.VerifyAll();
    }

    [Theory]
    [MemberData(nameof(NormalizedVersionSamples))]
    public async Task Assign_forwards_normalized_version_to_facade(string rawVersion, string expectedVersion)
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new(MockBehavior.Strict);
        httpFacade
            .Setup(f => f.AssignAsync(
                PackId,
                It.Is<PolicyPackAssignBody>(body => body.Version == expectedVersion),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.Success,
                Assignment = new PolicyPackAssignment
                {
                    PolicyPackId = PackId,
                    PolicyPackVersion = expectedVersion,
                },
            });

        PolicyPacksController sut = PolicyPacksControllerTestSupport.CreateController(httpFacade);

        AssignPolicyPackRequest request = new()
        {
            Version = rawVersion,
            ScopeLevel = "Project",
            IsPinned = false,
        };

        IActionResult result = await sut.Assign(PackId, request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        httpFacade.VerifyAll();
    }
}
