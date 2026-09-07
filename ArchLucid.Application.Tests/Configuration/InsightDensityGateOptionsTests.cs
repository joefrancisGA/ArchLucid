using ArchLucid.Application.Configuration;
using ArchLucid.Application.Tests.Support;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class InsightDensityGateOptionsTests
{
    [Fact]
    public void Default_prefer_high_novelty_engines_is_false()
    {
        InsightDensityGateOptions options = new();

        options.PreferHighNoveltyEngines.Should().BeFalse();
        options.NoveltyRateWindowDays.Should().Be(90);
    }

    [Fact]
    public void Default_max_judged_findings_per_snapshot_is_forty()
    {
        InsightDensityGateOptions options = new();

        options.MaxJudgedFindingsPerSnapshot.Should().Be(40);
    }

    [Fact]
    public void InsightDensityGateOptionsResolver_forces_prefer_high_novelty_off_in_simulator()
    {
        InsightDensityGateOptionsResolver resolver = new(
            Options.Create(new InsightDensityGateOptions
            {
                PreferHighNoveltyEngines = true,
            }),
            new FixedScopeContextProvider(new ScopeContext { TenantId = Guid.NewGuid() }),
            new InMemoryTenantSettingsRepository(),
            new FixedEffectiveAgentExecutionModeAccessor(DevAgentExecutionModeHeaderNames.Simulator));

        InsightDensityGateOptions effective = resolver.Resolve();

        effective.PreferHighNoveltyEngines.Should().BeFalse();
    }

    private sealed class FixedScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
