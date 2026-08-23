using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

using System.Reflection;

namespace ArchLucid.Contracts.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturePostureReadModelContractTests
{
    [Theory]
    [InlineData(typeof(PillarFindingAggregate))]
    [InlineData(typeof(ReviewIntegrityAggregate))]
    [InlineData(typeof(ArchitecturePostureReadModel))]
    public void Posture_contract_types_do_not_expose_score_ratio_or_percentage_properties(Type contractType)
    {
        IEnumerable<string> propertyNames = contractType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(static property => property.Name);

        propertyNames.Should().NotContainMatch("*Score*");
        propertyNames.Should().NotContainMatch("*Ratio*");
        propertyNames.Should().NotContainMatch("*Percent*");
        propertyNames.Should().NotContainMatch("*Grade*");
    }
}
