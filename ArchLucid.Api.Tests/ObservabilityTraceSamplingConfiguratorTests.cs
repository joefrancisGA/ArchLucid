using System.Reflection;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Startup.Tracing;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

using OpenTelemetry;
using OpenTelemetry.Trace;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for <see cref="ObservabilityTraceSamplingConfigurator" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ObservabilityTraceSamplingConfiguratorTests
{
    [SkippableFact]
    public void ConfigureTraceSampling_When_ratio_below_one_registers_parent_based_trace_id_ratio_sampler()
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
        GetLocalParentNotSampledSampler(parentBased).Should().BeOfType<AlwaysSampleActivitySourceSampler>();
    }

    [SkippableFact]
    public void ConfigureTraceSampling_When_always_sample_sources_configured_wraps_ratio_with_activity_source_sampler()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Observability:Tracing:SamplingRatio"] = "0.1",
                ["Observability:Tracing:AlwaysSampleActivitySources:0"] = ArchLucidInstrumentation.AuthorityRun.Name
            }).Build();

        TracerProviderBuilder builder = Sdk.CreateTracerProviderBuilder();
        ObservabilityTraceSamplingConfigurator.ConfigureTraceSampling(builder, configuration);

        using TracerProvider provider = builder.Build();
        Sampler sampler = GetTracerProviderSampler(provider);

        GetRootSampler((ParentBasedSampler)sampler).Should().BeOfType<AlwaysSampleActivitySourceSampler>();
    }

    [SkippableFact]
    public void ConfigureTraceSampling_When_ratio_one_matches_default_built_in_sampler_shape()
    {
        IConfiguration ratioOne = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Observability:Tracing:SamplingRatio"] = "1" }).Build();

        IConfiguration empty = new ConfigurationBuilder().AddInMemoryCollection().Build();

        TracerProviderBuilder configuredBuilder = Sdk.CreateTracerProviderBuilder();
        ObservabilityTraceSamplingConfigurator.ConfigureTraceSampling(configuredBuilder, ratioOne);

        TracerProviderBuilder emptyBuilder = Sdk.CreateTracerProviderBuilder();
        ObservabilityTraceSamplingConfigurator.ConfigureTraceSampling(emptyBuilder, empty);

        using TracerProvider configuredProvider = configuredBuilder.Build();
        using TracerProvider emptyProvider = emptyBuilder.Build();

        Sampler configuredSampler = GetTracerProviderSampler(configuredProvider);
        Sampler emptySampler = GetTracerProviderSampler(emptyProvider);

        configuredSampler.GetType().Should().Be(emptySampler.GetType());
        GetRootSampler((ParentBasedSampler)configuredSampler).Should().BeOfType<AlwaysOnSampler>();
        GetRootSampler((ParentBasedSampler)emptySampler).Should().BeOfType<AlwaysOnSampler>();
    }

    [SkippableFact]
    public void ConfigureTraceSampling_When_ratio_invalid_falls_back_to_full_sampling()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Observability:Tracing:SamplingRatio"] = "not-a-number" }).Build();

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

        object? value = property.GetValue(provider);

        value.Should().BeAssignableTo<Sampler>();

        return (Sampler)value;
    }

    private static Sampler GetRootSampler(ParentBasedSampler parentBasedSampler)
    {
        FieldInfo? rootField = typeof(ParentBasedSampler).GetField(
            "rootSampler",
            BindingFlags.Instance | BindingFlags.NonPublic);

        rootField.Should().NotBeNull();

        object? root = rootField.GetValue(parentBasedSampler);

        root.Should().BeAssignableTo<Sampler>();

        return (Sampler)root;
    }

    private static Sampler GetLocalParentNotSampledSampler(ParentBasedSampler parentBasedSampler)
    {
        FieldInfo? field = typeof(ParentBasedSampler).GetField(
            "localParentNotSampled",
            BindingFlags.Instance | BindingFlags.NonPublic);

        field.Should().NotBeNull();

        object? value = field.GetValue(parentBasedSampler);

        value.Should().BeAssignableTo<Sampler>();

        return (Sampler)value;
    }
}
