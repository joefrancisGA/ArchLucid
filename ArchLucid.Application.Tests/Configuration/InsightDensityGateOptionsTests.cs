using ArchLucid.Application.Configuration;
using ArchLucid.Application.Tests.Support;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class InsightDensityGateOptionsTests
{
    [Fact]
    public void Default_demotion_threshold_is_sixty_five()
    {
        InsightDensityGateOptions options = new();

        options.DemotionThreshold.Should().Be(65);
    }

    [Fact]
    public void Default_prefer_high_novelty_engines_is_false()
    {
        InsightDensityGateOptions options = new();

        options.PreferHighNoveltyEngines.Should().BeFalse();
        options.NoveltyRateWindowDays.Should().Be(90);
        options.EnableProseAssumptionExtraction.Should().BeFalse();
        options.PreferHighVerificationEngines.Should().BeFalse();
        options.VerificationPriorMinSample.Should().Be(20);
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

    [Fact]
    public void InsightDensityGateOptionsResolver_forces_prose_assumption_off_in_simulator()
    {
        InsightDensityGateOptionsResolver resolver = new(
            Options.Create(new InsightDensityGateOptions
            {
                EnableProseAssumptionExtraction = true,
                PreferHighVerificationEngines = true,
            }),
            new FixedScopeContextProvider(new ScopeContext { TenantId = Guid.NewGuid() }),
            new InMemoryTenantSettingsRepository(),
            new FixedEffectiveAgentExecutionModeAccessor(DevAgentExecutionModeHeaderNames.Simulator));

        InsightDensityGateOptions effective = resolver.Resolve();

        effective.EnableProseAssumptionExtraction.Should().BeFalse();
        effective.PreferHighVerificationEngines.Should().BeFalse();
    }

    [Fact]
    public async Task Real_mode_turns_on_ranking_priors_when_tenant_stored_nothing()
    {
        Guid tenantId = Guid.NewGuid();
        InsightDensityGateOptions effective = await ResolveRealModeAsync(tenantId, new InsightDensityGateOptions());

        effective.PreferHighNoveltyEngines.Should().BeTrue();
        effective.PreferHighVerificationEngines.Should().BeTrue();
        effective.EnableInsightGenerator.Should().BeTrue();
        effective.EnableLlmJudge.Should().BeTrue();
        effective.EnableLlmJudgeForEngineFindings.Should().BeTrue();
    }

    [Fact]
    public async Task Real_mode_honours_tenant_opt_out_of_ranking_priors()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.FindingsInsightDensityPreferHighNoveltyEnginesEnabled,
            "false",
            CancellationToken.None);
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.FindingsInsightDensityPreferHighVerificationEnginesEnabled,
            "false",
            CancellationToken.None);

        InsightDensityGateOptions effective = await ResolveRealModeAsync(
            tenantId,
            new InsightDensityGateOptions(),
            settings);

        effective.PreferHighNoveltyEngines.Should().BeFalse();
        effective.PreferHighVerificationEngines.Should().BeFalse();
        effective.EnableLlmJudge.Should().BeTrue("opting out of ranking must not disable judging");
    }

    [Fact]
    public async Task Real_mode_honours_tenant_opt_out_of_insight_generator()
    {
        // Before DX-57 the generator override was hard-coded absent, so a tenant could not decline the
        // generative Premium pass while keeping the judge.
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.FindingsInsightDensityInsightGeneratorEnabled,
            "false",
            CancellationToken.None);

        InsightDensityGateOptions effective = await ResolveRealModeAsync(
            tenantId,
            new InsightDensityGateOptions(),
            settings);

        effective.EnableInsightGenerator.Should().BeFalse();
        effective.EnableLlmJudge.Should().BeTrue();
    }

    [Fact]
    public async Task Real_mode_turns_on_prose_assumption_extraction_when_tenant_stored_nothing()
    {
        Guid tenantId = Guid.NewGuid();

        InsightDensityGateOptions effective = await ResolveRealModeAsync(
            tenantId,
            new InsightDensityGateOptions());

        effective.EnableProseAssumptionExtraction.Should().BeTrue(
            "owner decision 2026-09-09: Real mode turns prose extraction on unless the tenant opts out");
    }

    [Fact]
    public async Task Real_mode_honours_tenant_opt_out_of_prose_assumption_extraction()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.FindingsInsightDensityProseAssumptionExtractionEnabled,
            "false",
            CancellationToken.None);

        InsightDensityGateOptions effective = await ResolveRealModeAsync(
            tenantId,
            new InsightDensityGateOptions(),
            settings);

        effective.EnableProseAssumptionExtraction.Should().BeFalse();
    }

    [Fact]
    public async Task Simulator_ignores_tenant_opt_in_to_ranking_priors()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSettingsRepository settings = new();
        await settings.UpsertAsync(
            tenantId,
            TenantSettingKeys.FindingsInsightDensityPreferHighNoveltyEnginesEnabled,
            "true",
            CancellationToken.None);

        InsightDensityGateOptionsResolver resolver = new(
            Options.Create(new InsightDensityGateOptions()),
            new FixedScopeContextProvider(new ScopeContext { TenantId = tenantId }),
            settings,
            new FixedEffectiveAgentExecutionModeAccessor(DevAgentExecutionModeHeaderNames.Simulator));

        InsightDensityGateOptions effective = resolver.Resolve();

        effective.PreferHighNoveltyEngines.Should().BeFalse();
        effective.EnableInsightGenerator.Should().BeFalse();
    }

    private static Task<InsightDensityGateOptions> ResolveRealModeAsync(
        Guid tenantId,
        InsightDensityGateOptions hostOptions,
        InMemoryTenantSettingsRepository? tenantSettings = null)
    {
        InsightDensityGateOptionsResolver resolver = new(
            Options.Create(hostOptions),
            new FixedScopeContextProvider(new ScopeContext { TenantId = tenantId }),
            tenantSettings ?? new InMemoryTenantSettingsRepository(),
            new FixedEffectiveAgentExecutionModeAccessor(DevAgentExecutionModeHeaderNames.Real));

        return Task.FromResult(resolver.Resolve());
    }

    private sealed class FixedScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
