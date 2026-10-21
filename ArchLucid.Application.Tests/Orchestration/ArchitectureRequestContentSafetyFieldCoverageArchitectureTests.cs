using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRequestContentSafetyFieldCoverageArchitectureTests
{
    private readonly DefaultRequestContentSafetyPrecheck _precheck = new();

    [Fact]
    public void Agent_reachable_string_catalog_documents_every_exemption_path()
    {
        IReadOnlyList<string> catalog = ArchitectureRequestAgentReachableStringPaths.Enumerate();

        foreach (string exemptPath in ArchitectureRequestContentSafetyScanExemptions.ExemptionReasons.Keys)
        {
            catalog.Should().Contain(exemptPath, $"exemption {exemptPath} must appear in the catalog");
        }
    }

    [Fact]
    public async Task Every_non_exempt_agent_reachable_string_field_blocks_prompt_injection()
    {
        foreach (string path in ArchitectureRequestAgentReachableStringPaths.Enumerate())
        {
            if (ArchitectureRequestContentSafetyScanExemptions.IsExempt(path))
                continue;

            ArchitectureRequest request = ArchitectureRequestContentSafetyProbeFactory.CreateWithInjectionAtPath(
                path,
                ArchitectureRequestContentSafetyProbeFactory.InjectionPayload);

            RequestContentSafetyResult result = await _precheck.EvaluateAsync(request, CancellationToken.None);

            result.IsAllowed.Should().BeFalse($"path {path} must be scanned by DefaultRequestContentSafetyPrecheck");
            result.Reasons.Should().NotBeEmpty();
        }
    }
}
