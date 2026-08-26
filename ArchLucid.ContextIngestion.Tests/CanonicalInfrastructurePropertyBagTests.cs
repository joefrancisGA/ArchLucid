using ArchLucid.ContextIngestion.Infrastructure;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class CanonicalInfrastructurePropertyBagTests
{
    [Fact]
    public void TryAddTfProperty_redacts_sensitive_keys()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

        CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, "admin_password", "supersecret")
            .Should().BeTrue();

        properties["tf.admin_password"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryAddTfProperty_truncates_long_values()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);
        string longValue = new('a', 600);

        CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, "note", longValue)
            .Should().BeTrue();

        properties["tf.note"].Length.Should().Be(512);
    }
}
