using ArchLucid.Persistence.Alerts; using FluentAssertions;
namespace ArchLucid.Persistence.Tests.Alerts;
[Trait("Category","Unit")][Trait("Suite","Core")]
public sealed class AlertRecordRepositoryCoreTests {
 [Fact] public void ValidateAlertKeysetCursor_rejects_partial(){Action a=()=>AlertRecordRepositoryCore.ValidateAlertKeysetCursor(DateTime.UtcNow,null);a.Should().Throw<ArgumentException>();}
}
