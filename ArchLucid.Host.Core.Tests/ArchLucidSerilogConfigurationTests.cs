using ArchLucid.Host.Core.Startup;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchLucidSerilogConfigurationTests
{
    [Fact]
    public void IsSerilogWriteToEmpty_returns_true_when_missing()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection([])
            .Build();

        bool isEmpty = ArchLucidSerilogConfiguration.IsSerilogWriteToEmpty(configuration);

        isEmpty.Should().BeTrue();
    }

    [Fact]
    public void IsSerilogWriteToEmpty_returns_false_when_sink_defined()
    {
        Dictionary<string, string?> values = new()
        {
            ["Serilog:WriteTo:0:Name"] = "Console"
        };
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();

        bool isEmpty = ArchLucidSerilogConfiguration.IsSerilogWriteToEmpty(configuration);

        isEmpty.Should().BeFalse();
    }
}
