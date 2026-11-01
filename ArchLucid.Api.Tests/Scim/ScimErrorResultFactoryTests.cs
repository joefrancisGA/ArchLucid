using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Scim;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests.Scim;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScimErrorResultFactoryTests
{
    [Fact]
    public void FromParseException_returns_501_for_notImplemented_scim_type()
    {
        ScimUserResourceParseException ex = new("notImplemented", "Complex attribute path is not implemented.");

        IActionResult result = ScimErrorResultFactory.FromParseException(ex);

        ContentResult content = result.Should().BeOfType<ContentResult>().Subject;
        content.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);
        content.ContentType.Should().Be("application/scim+json; charset=utf-8");
        content.Content.Should().Contain("notImplemented");
    }
}
