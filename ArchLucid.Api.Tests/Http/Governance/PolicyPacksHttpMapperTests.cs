using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPacksHttpMapperTests
{
    [Fact]
    public void ValidateRouteId_rejects_empty_guid()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidateRouteId(Guid.Empty, "policyPackId");

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("policyPackId");
        validation.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidatePromoteCatalogEntry_requires_source_pack_id()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest { SourcePolicyPackId = Guid.Empty });

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("sourcePolicyPackId");
    }

    [Fact]
    public void ValidatePromoteCatalogEntry_rejects_whitespace_only_optional_version()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "   ",
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain("Version");
    }

    [Fact]
    public void ValidatePromoteCatalogEntry_rejects_overlong_optional_version()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = new string('1', PolicyPackRequestValidationRules.PackVersionMaxLength + 1),
            });

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain(PolicyPackRequestValidationRules.PackVersionMaxLength.ToString());
    }

    [Fact]
    public void ValidatePromoteCatalogEntry_rejects_non_semver_optional_version()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "latest",
            });

        validation.Should().NotBeNull();
        validation!.Message.Should().Be(PolicyPackRequestValidationRules.PackVersionSemVerMessage);
    }

    [Fact]
    public void ValidatePackVersion_rejects_blank_version()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePackVersion("   ");

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("Version");
    }

    [Fact]
    public void ValidatePackVersion_rejects_overlong_version()
    {
        string overlongVersion = new string('1', PolicyPackRequestValidationRules.PackVersionMaxLength + 1);

        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePackVersion(overlongVersion);

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain(PolicyPackRequestValidationRules.PackVersionMaxLength.ToString());
        validation.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidatePackVersion_rejects_non_semver_version()
    {
        GovernanceHttpValidation? validation = PolicyPacksHttpMapper.ValidatePackVersion("latest");

        validation.Should().NotBeNull();
        validation!.Message.Should().Be(PolicyPackRequestValidationRules.PackVersionSemVerMessage);
        validation.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }
}
