using System.Reflection;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.Advisory;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Ensures Advanced Analysis controllers stay behind <see cref="RequiresCommercialTenantTierAttribute" />.</summary>
public sealed class CommercialPackagingMetadataTests
{
    [Theory]
    [InlineData(typeof(AdvisoryController))]
    [InlineData(typeof(AdvisorySchedulingController))]
    [InlineData(typeof(AuthorityCompareController))]
    [InlineData(typeof(ComparisonController))]
    [InlineData(typeof(DocxExportController))]
    [InlineData(typeof(GraphController))]
    public void Controller_has_requires_commercial_tier_standard(Type controllerType)
    {
        RequiresCommercialTenantTierAttribute? attr =
            controllerType.GetCustomAttribute<RequiresCommercialTenantTierAttribute>(true);

        attr.Should().NotBeNull($"{controllerType.Name} must declare commercial tier packaging.");
        attr.Arguments.Should().HaveCount(1);
        attr.Arguments[0].Should().Be(TenantTier.Standard);
    }
}
