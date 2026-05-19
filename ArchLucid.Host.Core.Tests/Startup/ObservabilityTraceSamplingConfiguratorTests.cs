using System.Reflection;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Startup.Tracing;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

using OpenTelemetry;
using OpenTelemetry.Trace;

namespace ArchLucid.Host.Core.Tests.Startup;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ObservabilityTraceSamplingConfiguratorTests
{
    [Fact]
    public void ConfigureTraceSampling_When_ratio_below_one_registers_always_sample_parent_based_sampler()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Observability:Tracing:SamplingRatio"] = "0.1" }).Build();

        TracerProviderBuilder builder = Sdk.CreateTracerProviderBuilder();
        ObservabilityTraceSamplingConfigurator.ConfigureTraceSampling(builder, configuration);

        using TracerProvider provider = builder.Build();
        Sampler sampler = GetTracerProviderSampler(provider);

        sampler.Should().BeOfType<ParentBasedSampler>();
        ParentBasedSampler parentBased = (ParentBasedSampler)sampler;
        GetRootSampler(parentBased).Should().BeOfType<AlwaysSampleActivitySourceSampler>();
    }

    [Fact]
    public void ConfigureTraceSampling_When_ratio_one_does_not_register_custom_sampler()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Observability:Tracing:SamplingRatio"] = "1" }).Build();

        TracerProviderBuilder builder = Sdk.CreateTracerProviderBuilder();
        ObservabilityTraceSamplingConfigurator.ConfigureTraceSampling(builder, configuration);

        using TracerProvider provider = builder.Build();
        Sampler sampler = GetTracerProviderSampler(provider);

        GetRootSampler((ParentBasedSampler)sampler).Should().BeOfType<AlwaysOnSampler>();
    }

    private static Sampler GetTracerProviderSampler(TracerProvider provider)
    {
        PropertyInfo? property = provider.GetType().GetProperty(
            "Sampler",
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

        property.Should().NotBeNull();

        return (Sampler)property.GetValue(provider)!;
    }

    private static Sampler GetRootSampler(ParentBasedSampler parentBasedSampler)
    {
        FieldInfo? rootField = typeof(ParentBasedSampler).GetField(
            "rootSampler",
            BindingFlags.Instance | BindingFlags.NonPublic);

        rootField.Should().NotBeNull();

        return (Sampler)rootField.GetValue(parentBasedSampler)!;
    }
}
