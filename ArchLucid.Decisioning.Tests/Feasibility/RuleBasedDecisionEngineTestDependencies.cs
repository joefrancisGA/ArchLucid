using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest.Builders;
using ArchLucid.Decisioning.Services;

namespace ArchLucid.Decisioning.Tests.Feasibility;

internal static class RuleBasedDecisionEngineTestDependencies
{
    internal static RuleBasedDecisionEngine CreateEngine(IDecisionRuleProvider ruleProvider) =>
        new(
            ruleProvider,
            DefaultGoldenManifestBuilderTestFactory.Create(),
            new GoldenManifestValidator(),
            new ManifestHashService(),
            CreateFeasibilityComposer(),
            NullDecisionIntakeTrailProvider.Instance);

    internal static IAuthorityFeasibilityVerdictComposer CreateFeasibilityComposer() =>
        new AuthorityFeasibilityVerdictComposer(
            new FeasibilityVerdictBuilder(new FeasibilityVerdictValidator()));
}
