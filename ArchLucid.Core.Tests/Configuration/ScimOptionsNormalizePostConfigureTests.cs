using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Configuration")]
public sealed class ScimOptionsNormalizePostConfigureTests
{
    [Fact]
    public void PostConfigure_trims_group_role_mapping_override_keys_from_configuration_binding()
    {
        ScimOptions options = new()
        {
            GroupRoleMappingOverrides = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["  CustomAdmins  "] = ArchLucidRoles.Operator,
            },
        };

        new ScimOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.GroupRoleMappingOverrides.Should().ContainKey("CustomAdmins");
        options.GroupRoleMappingOverrides["CustomAdmins"].Should().Be(ArchLucidRoles.Operator);
    }

    [Fact]
    public void PostConfigure_trims_group_role_mapping_override_values_from_configuration_binding()
    {
        ScimOptions options = new()
        {
            GroupRoleMappingOverrides = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["CustomAdmins"] = $"  {ArchLucidRoles.Operator}  ",
            },
        };

        new ScimOptionsNormalizePostConfigure().PostConfigure(Options.DefaultName, options);

        options.GroupRoleMappingOverrides["CustomAdmins"].Should().Be(ArchLucidRoles.Operator);
    }
}
