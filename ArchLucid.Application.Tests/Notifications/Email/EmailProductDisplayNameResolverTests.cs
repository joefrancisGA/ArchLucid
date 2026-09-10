using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductLine;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class EmailProductDisplayNameResolverTests
{
    [Fact]
    public void Resolve_uses_product_line_when_explicit()
    {
        EmailNotificationOptions options = new() { ProductDisplayName = "Legacy override" };

        EmailProductDisplayNameResolver.Resolve(options, ProductLineId.Security).Should().Be("SecureNow");
    }

    [Fact]
    public void Resolve_honors_legacy_ProductDisplayName_when_product_line_unset()
    {
        EmailNotificationOptions options = new() { ProductDisplayName = "Legacy override" };

        EmailProductDisplayNameResolver.Resolve(options).Should().Be("Legacy override");
    }

    [Fact]
    public void Resolve_defaults_to_architecture_when_unset()
    {
        EmailProductDisplayNameResolver.Resolve(new EmailNotificationOptions()).Should().Be("ArchLucid");
    }

    [Fact]
    public void Resolve_uses_configured_security_name()
    {
        ProductLineDisplayNamesOptions displayNames = new() { Security = "SecureNow Pro" };

        EmailProductDisplayNameResolver
            .Resolve(new EmailNotificationOptions(), ProductLineId.Security, displayNames)
            .Should()
            .Be("SecureNow Pro");
    }
}
