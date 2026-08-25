using ArchLucid.Core.Billing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Billing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BillingConversionBlockedExceptionTests
{
    [Fact]
    public void BillingConversionBlockedException_carries_operator_message()
    {
        BillingConversionBlockedException ex = new("Activate billing before converting the trial.");

        ex.Message.Should().Be("Activate billing before converting the trial.");
    }
}
