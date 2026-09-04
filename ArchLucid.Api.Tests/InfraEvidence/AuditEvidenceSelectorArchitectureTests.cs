using System.Reflection;

using FluentAssertions;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class AuditEvidenceSelectorArchitectureTests
{
    [Fact]
    public void AuditEvidence_selectors_do_not_reference_hosted_arm_read_client()
    {
        Assembly applicationAssembly = typeof(Application.InfraEvidence.AuditEvidence.InventoryAuditEvidenceSelector).Assembly;

        IEnumerable<Type> auditEvidenceTypes = applicationAssembly
            .GetTypes()
            .Where(type => type.Namespace is not null
                && type.Namespace.Contains("AuditEvidence", StringComparison.Ordinal));

        foreach (Type type in auditEvidenceTypes)
        {
            bool referencesArmClient = type
                .GetFields(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
                .Concat(type.GetProperties(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
                    .Select(property => (MemberInfo)property))
                .Concat(type.GetMethods(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
                    .Select(method => (MemberInfo)method))
                .SelectMany(member => GetReferencedTypes(member))
                .Any(referencedType =>
                    string.Equals(referencedType.Name, "IHostedAzureArmReadClient", StringComparison.Ordinal)
                    || referencedType.FullName?.Contains("HostedAzureArm", StringComparison.Ordinal) == true);

            referencesArmClient.Should().BeFalse($"type {type.FullName} must read snapshots only");
        }
    }

    private static IEnumerable<Type> GetReferencedTypes(MemberInfo member) =>
        member switch
        {
            FieldInfo field => [field.FieldType],
            PropertyInfo property => [property.PropertyType],
            MethodInfo method => method.GetParameters().Select(parameter => parameter.ParameterType)
                .Append(method.ReturnType),
            _ => [],
        };
}
