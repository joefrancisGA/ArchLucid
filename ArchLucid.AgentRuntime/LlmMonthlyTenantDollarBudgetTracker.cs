using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     UTC-month estimated USD spend per tenant for <see cref="LlmMonthlyTenantDollarBudgetOptions" /> (warn once,
///     hard stop), backed by <see cref="ILlmTenantBudgetRepository" /> with pre-call reserve and post-call settle
///     (INV-004).
/// </summary>
public sealed partial class LlmMonthlyTenantDollarBudgetTracker(
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> optionsMonitor,
    ILlmCostEstimator costEstimator,
    ILlmTenantBudgetRepository budgetRepository,
    ILlmMonthlyTenantBudgetReservationStore reservationStore,
    ILlmTenantWalletService walletService,
    ITenantLlmMonthlyBudgetCapResolver budgetCapResolver,
    IConfiguration configuration,
    IHostEnvironment hostEnvironment,
    TimeProvider timeProvider)
{
    private const int MaxOptimisticRetries = 12;

    private static readonly AsyncLocal<Guid?> PendingReservationId = new();
    private static readonly AsyncLocal<string?> PendingReservationPeriodKey = new();
    private static readonly ConcurrentDictionary<Guid, int> InFlightReservationsByTenant = new();

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly ILlmMonthlyTenantBudgetReservationStore _reservationStore =
        reservationStore ?? throw new ArgumentNullException(nameof(reservationStore));

    private readonly ILlmTenantWalletService _walletService =
        walletService ?? throw new ArgumentNullException(nameof(walletService));

    private readonly ITenantLlmMonthlyBudgetCapResolver _budgetCapResolver =
        budgetCapResolver ?? throw new ArgumentNullException(nameof(budgetCapResolver));

    private readonly ILlmCostEstimator _costEstimator = costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
}
