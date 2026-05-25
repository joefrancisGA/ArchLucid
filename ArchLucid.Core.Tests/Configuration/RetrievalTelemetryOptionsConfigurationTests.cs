using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class RetrievalTelemetryOptionsConfigurationTests
{
    [Fact]
    public void RetrievalTelemetryOptions_defaults_RecordPerTenantTags_false()
    {
        RetrievalTelemetryOptions sut = new();

        sut.RecordPerTenantTags.Should().BeFalse();
        sut.EstimatedTenantCount.Should().Be(0);
        sut.MaxRecommendedTenantCountForPerTenantTags.Should().Be(100);
    }

    [Fact]
    public void RetrievalTelemetryOptions_section_binds_RecordPerTenantTags_when_true()
    {
        Dictionary<string, string?> data = new()
        {
            [$"{RetrievalTelemetryOptions.SectionName}:RecordPerTenantTags"] = "true",
            [$"{RetrievalTelemetryOptions.SectionName}:EstimatedTenantCount"] = "250",
            [$"{RetrievalTelemetryOptions.SectionName}:MaxRecommendedTenantCountForPerTenantTags"] = "50",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        RetrievalTelemetryOptions? bound = cfg.GetSection(RetrievalTelemetryOptions.SectionName).Get<RetrievalTelemetryOptions>();

        bound.Should().NotBeNull();
        bound!.RecordPerTenantTags.Should().BeTrue();
        bound.EstimatedTenantCount.Should().Be(250);
        bound.MaxRecommendedTenantCountForPerTenantTags.Should().Be(50);
    }
}
