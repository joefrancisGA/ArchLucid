using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRunPartialBudgetExceptionTests
{
    [Fact]
    public void Constructor_NullBudgetCause_ThrowsArgumentNullException()
    {
        var exception = Assert.Throws<ArgumentNullException>(
            () => new AgentRunPartialBudgetException(null!, Array.Empty<AgentResult>()));

        Assert.Equal("budgetCause", exception.ParamName);
    }

    [Fact]
    public void Constructor_NullResults_ThrowsArgumentNullException()
    {
        var cause = new CostLimitExceededException("Budget exceeded");
        var exception = Assert.Throws<ArgumentNullException>(
            () => new AgentRunPartialBudgetException(cause, null!));

        Assert.Equal("completedResults", exception.ParamName);
    }

    [Fact]
    public void Constructor_ValidArguments_PreservesCauseAndResults()
    {
        var cause = new CostLimitExceededException("Budget exceeded", CostLimitExceededKind.RunTokenBudget);
        IReadOnlyList<AgentResult> results = Array.Empty<AgentResult>();

        var exception = new AgentRunPartialBudgetException(cause, results);

        Assert.Same(cause, exception.BudgetCause);
        Assert.Same(cause, exception.InnerException);
        Assert.Same(results, exception.CompletedResults);
        Assert.Equal(cause.Message, exception.Message);
    }
}
