using ArchLucid.Api.Contracts;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ArchitectureRunPinIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task PinRun_toggle_and_explicit_set_persist_on_summary()
    {
        CreatedRunForTest created = await CreateRunForTestAsync();

        PinRunResponse firstPayload = await created.PatchPinAsync(Client, JsonOptions);
        firstPayload.IsPinned.Should().BeTrue();

        RunSummaryResponse summary = await created.GetAuthorityRunSummaryAsync(Client, JsonOptions);
        summary.IsPinned.Should().BeTrue();

        PinRunResponse unpinPayload = await created.PatchPinAsync(Client, JsonOptions, isPinned: false);
        unpinPayload.IsPinned.Should().BeFalse();
    }
}
