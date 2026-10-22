using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Controllers.Governance;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>Guards primary user-facing export/download HTTP surfaces from accidental removal.</summary>
[Trait("Suite", "Architecture")]
public sealed class ExportControllerSurfaceArchitectureTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Export_controllers_remain_public_for_operator_discoverability()
    {
        Type[] surfaces =
        [
            typeof(AuditController),
            typeof(ExportsController),
            typeof(ManifestsController),
            typeof(RunComparisonController),
            typeof(RunQueryController),
        ];

        surfaces.Should().OnlyHaveUniqueItems();
        foreach (Type t in surfaces)
        {
            t.IsPublic.Should().BeTrue(because: $"{t.FullName} is part of the curated export surface");
        }
    }
}
