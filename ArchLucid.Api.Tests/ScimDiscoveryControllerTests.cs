using ArchLucid.Api.Controllers.Scim;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ScimDiscoveryControllerTests
{
    [Fact]
    public void ServiceProviderConfig_returns_scim_json_with_patch_supported()
    {
        ScimDiscoveryController controller = new();

        IActionResult action = controller.ServiceProviderConfig();

        ContentResult content = action.Should().BeOfType<ContentResult>().Subject;
        content.ContentType.Should().Be("application/scim+json; charset=utf-8");
        content.Content.Should().Contain("ServiceProviderConfig");
        content.Content.Should().Contain("\"supported\":true");
    }

    [Fact]
    public void Schemas_lists_user_and_group_resources()
    {
        ScimDiscoveryController controller = new();

        IActionResult action = controller.Schemas();

        ContentResult content = action.Should().BeOfType<ContentResult>().Subject;
        content.Content.Should().Contain("urn:ietf:params:scim:schemas:core:2.0:User");
        content.Content.Should().Contain("urn:ietf:params:scim:schemas:core:2.0:Group");
        content.Content.Should().Contain("\"totalResults\":2");
    }

    [Fact]
    public void ResourceTypes_lists_user_and_group_endpoints()
    {
        ScimDiscoveryController controller = new();

        IActionResult action = controller.ResourceTypes();

        ContentResult content = action.Should().BeOfType<ContentResult>().Subject;
        content.Content.Should().Contain("\"endpoint\":\"/Users\"");
        content.Content.Should().Contain("\"endpoint\":\"/Groups\"");
    }
}
