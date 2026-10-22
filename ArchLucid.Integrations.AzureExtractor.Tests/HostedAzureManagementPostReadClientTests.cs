using System.Globalization;
using System.Net;
using System.Text;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;
[Trait("Category", "Unit")]

public sealed class HostedAzureManagementPostReadClientTests
{
    [Fact]
    public async Task QueryPolicyComplianceAsync_rejects_same_subscription_next_link_for_another_resource()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string wrongResourceNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "policyAssignmentId": "policy-1",
                                     "complianceState": "Compliant"
                                   }
                                 ],
                                 "@odata.nextLink": "WRONG_RESOURCE_LINK"
                               }
                               """.Replace("WRONG_RESOURCE_LINK", wrongResourceNextLink, StringComparison.Ordinal);

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody, Encoding.UTF8, "application/json")
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: policy compliance query followed a nextLink for another resource.");
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzurePolicyComplianceDocument document = await client.QueryPolicyComplianceAsync(
            "token-abc",
            subscriptionId,
            "subscription",
            "2026-09-26T00:00:00Z",
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Single(document.Records);
    }

    [Fact]
    public async Task QueryPolicyComplianceAsync_rejects_next_link_for_different_subscription_id()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string otherSubscriptionId = "22222222-2222-2222-2222-222222222222";
        const string crossSubscriptionNextLink =
            $"https://management.azure.com/subscriptions/{otherSubscriptionId}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "policyAssignmentId": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyAssignments/pa1",
                                     "complianceState": "Compliant"
                                   }
                                 ],
                                 "@odata.nextLink": "CROSS_SUBSCRIPTION_LINK"
                               }
                               """.Replace("CROSS_SUBSCRIPTION_LINK", crossSubscriptionNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "policyAssignmentId": "/subscriptions/22222222-2222-2222-2222-222222222222/providers/Microsoft.Authorization/policyAssignments/pa2",
                                      "complianceState": "NonCompliant"
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    Assert.Equal(HttpMethod.Post, request.Method);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody, Encoding.UTF8, "application/json")
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossSubscriptionNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody, Encoding.UTF8, "application/json")
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: policy compliance query did not stop on cross-subscription nextLink.");
            });

        HttpClient httpClient = new(handler);
        HostedAzureManagementPostReadClient client = new(httpClient, NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzurePolicyComplianceDocument document = await client.QueryPolicyComplianceAsync(
            "token-abc",
            subscriptionId,
            "subscription",
            "2026-09-26T00:00:00Z",
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Single(document.Records);
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_rejects_next_link_for_different_subscription_id()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string otherSubscriptionId = "22222222-2222-2222-2222-222222222222";
        const string crossSubscriptionNextLink =
            $"https://management.azure.com/subscriptions/{otherSubscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-03-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "properties": {
                                   "columns": [
                                     { "name": "PreTaxCost", "type": "Number" },
                                     { "name": "ServiceName", "type": "String" },
                                     { "name": "Currency", "type": "String" }
                                   ],
                                   "rows": [
                                     [ 10.0, "Storage", "USD" ]
                                   ],
                                   "nextLink": "CROSS_SUBSCRIPTION_LINK"
                                 }
                               }
                               """.Replace("CROSS_SUBSCRIPTION_LINK", crossSubscriptionNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "properties": {
                                    "columns": [
                                      { "name": "PreTaxCost", "type": "Number" },
                                      { "name": "ServiceName", "type": "String" },
                                      { "name": "Currency", "type": "String" }
                                    ],
                                    "rows": [
                                      [ 999.0, "Storage", "USD" ]
                                    ]
                                  }
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    Assert.Equal(HttpMethod.Post, request.Method);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody, Encoding.UTF8, "application/json")
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(HttpMethod.Get, request.Method);
                    Assert.Equal(crossSubscriptionNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody, Encoding.UTF8, "application/json")
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: ActualCost query did not stop on cross-subscription nextLink.");
            });

        HttpClient httpClient = new(handler);
        HostedAzureManagementPostReadClient client = new(httpClient, NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Null(summary);
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_rejects_same_subscription_next_link_for_another_resource()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string wrongResourceNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/budgets";

        string firstPageBody = """
                               {
                                 "properties": {
                                   "columns": [
                                     { "name": "PreTaxCost", "type": "Number" },
                                     { "name": "ServiceName", "type": "String" },
                                     { "name": "Currency", "type": "String" }
                                   ],
                                   "rows": [
                                     [ 10.0, "Storage", "USD" ]
                                   ],
                                   "nextLink": "WRONG_RESOURCE_LINK"
                                 }
                               }
                               """.Replace("WRONG_RESOURCE_LINK", wrongResourceNextLink, StringComparison.Ordinal);

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody, Encoding.UTF8, "application/json")
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: ActualCost query followed a nextLink for another resource.");
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Null(summary);
    }

    [Fact]
    public async Task QueryPolicyComplianceAsync_propagates_cancellation_instead_of_returning_partial_success()
    {
        using CancellationTokenSource cancellationTokenSource = new();
        HttpMessageHandler handler = new RecordingHandler(
            (_, cancellationToken) => throw new OperationCanceledException(cancellationToken));
        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            client.QueryPolicyComplianceAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                "subscription",
                "2026-09-26T00:00:00Z",
                cancellationTokenSource.Token));
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_propagates_cancellation_instead_of_returning_null()
    {
        using CancellationTokenSource cancellationTokenSource = new();
        HttpMessageHandler handler = new RecordingHandler(
            (_, cancellationToken) => throw new OperationCanceledException(cancellationToken));
        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            client.TryQueryActualCostSummaryAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                cancellationTokenSource.Token));
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_merges_paginated_rows_using_each_page_column_order()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query";

        const string firstPageBody = """
                                     {
                                       "properties": {
                                         "columns": [
                                           { "name": "PreTaxCost", "type": "Number" },
                                           { "name": "ServiceName", "type": "String" },
                                           { "name": "Currency", "type": "String" }
                                         ],
                                         "rows": [
                                           [ 10.0, "Storage", "USD" ]
                                         ],
                                         "nextLink": "COST_QUERY_NEXT_LINK"
                                       }
                                     }
                                     """;

        const string secondPageBody = """
                                    {
                                      "properties": {
                                        "columns": [
                                          { "name": "ServiceName", "type": "String" },
                                          { "name": "PreTaxCost", "type": "Number" },
                                          { "name": "Currency", "type": "String" }
                                        ],
                                        "rows": [
                                          [ "Compute", 5.0, "USD" ]
                                        ]
                                      }
                                    }
                                    """;

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                firstPageBody.Replace("COST_QUERY_NEXT_LINK", nextLink, StringComparison.Ordinal),
                                Encoding.UTF8,
                                "application/json")
                        });
                }

                if (current == 2)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody, Encoding.UTF8, "application/json")
                        });
                }

                throw new InvalidOperationException("Unexpected Actual Cost request.");
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.NotNull(summary);
        Assert.Equal(15.0, summary.TotalActualCostUsd);
        Assert.Equal(2, summary.BreakdownByServiceName.Count);
        Assert.Contains(summary.BreakdownByServiceName, row => row.ServiceName == "Storage" && row.PreTaxCost == 10.0);
        Assert.Contains(summary.BreakdownByServiceName, row => row.ServiceName == "Compute" && row.PreTaxCost == 5.0);
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_retains_merged_cost_when_later_page_body_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query";

        const string firstPageBody = """
                                     {
                                       "properties": {
                                         "columns": [
                                           { "name": "PreTaxCost", "type": "Number" },
                                           { "name": "ServiceName", "type": "String" },
                                           { "name": "Currency", "type": "String" }
                                         ],
                                         "rows": [
                                           [ 10.0, "Storage", "USD" ]
                                         ],
                                         "nextLink": "COST_QUERY_NEXT_LINK"
                                       }
                                     }
                                     """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                firstPageBody.Replace("COST_QUERY_NEXT_LINK", nextLink, StringComparison.Ordinal),
                                Encoding.UTF8,
                                "application/json")
                        });
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{ not-json", Encoding.UTF8, "application/json")
                    });
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.NotNull(summary);
        Assert.Equal(10.0, summary.TotalActualCostUsd);
        Assert.Single(summary.BreakdownByServiceName);
    }

    [Fact]
    public async Task QueryPolicyComplianceAsync_uses_empty_collection_reader_note_when_first_page_body_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{ not-json", Encoding.UTF8, "application/json")
                }));

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzurePolicyComplianceDocument document = await client.QueryPolicyComplianceAsync(
            "token-abc",
            subscriptionId,
            "subscription",
            "2026-09-26T00:00:00Z",
            CancellationToken.None);

        Assert.Equal(0, document.RecordCount);
        Assert.Contains("empty records", document.ReaderNote, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task QueryPolicyComplianceAsync_retains_records_when_later_page_body_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01&$skiptoken=page2";

        const string firstPageBody = """
                                     {
                                       "value": [
                                         {
                                           "policyAssignmentId": "policy-1",
                                           "complianceState": "Compliant"
                                         }
                                       ],
                                       "@odata.nextLink": "POLICY_QUERY_NEXT_LINK"
                                     }
                                     """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                firstPageBody.Replace("POLICY_QUERY_NEXT_LINK", nextLink, StringComparison.Ordinal),
                                Encoding.UTF8,
                                "application/json")
                        });
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{ not-json", Encoding.UTF8, "application/json")
                    });
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzurePolicyComplianceDocument document = await client.QueryPolicyComplianceAsync(
            "token-abc",
            subscriptionId,
            "subscription",
            "2026-09-26T00:00:00Z",
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Equal(1, document.RecordCount);
        Assert.Single(document.Records);
        Assert.DoesNotContain("empty records", document.ReaderNote, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task QueryPolicyComplianceAsync_retains_records_with_accurate_reader_note_when_later_page_fails()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01&$skiptoken=page2";

        const string firstPageBody = """
                                     {
                                       "value": [
                                         {
                                           "policyAssignmentId": "policy-1",
                                           "complianceState": "Compliant"
                                         }
                                       ],
                                       "@odata.nextLink": "POLICY_QUERY_NEXT_LINK"
                                     }
                                     """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                firstPageBody.Replace("POLICY_QUERY_NEXT_LINK", nextLink, StringComparison.Ordinal),
                                Encoding.UTF8,
                                "application/json")
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzurePolicyComplianceDocument document = await client.QueryPolicyComplianceAsync(
            "token-abc",
            subscriptionId,
            "subscription",
            "2026-09-26T00:00:00Z",
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Equal(1, document.RecordCount);
        Assert.Single(document.Records);
        Assert.DoesNotContain("empty records", document.ReaderNote, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_retains_merged_cost_when_later_page_fails()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query";

        const string firstPageBody = """
                                     {
                                       "properties": {
                                         "columns": [
                                           { "name": "PreTaxCost", "type": "Number" },
                                           { "name": "ServiceName", "type": "String" },
                                           { "name": "Currency", "type": "String" }
                                         ],
                                         "rows": [
                                           [ 10.0, "Storage", "USD" ]
                                         ],
                                         "nextLink": "COST_QUERY_NEXT_LINK"
                                       }
                                     }
                                     """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                firstPageBody.Replace("COST_QUERY_NEXT_LINK", nextLink, StringComparison.Ordinal),
                                Encoding.UTF8,
                                "application/json")
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.NotNull(summary);
        Assert.Equal(10.0, summary.TotalActualCostUsd);
        Assert.Single(summary.BreakdownByServiceName);
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_retains_merged_cost_when_next_link_repeats()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string repeatingNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-03-01&$skiptoken=repeat";

        string pageBody = """
                          {
                            "properties": {
                              "columns": [
                                { "name": "PreTaxCost", "type": "Number" },
                                { "name": "ServiceName", "type": "String" },
                                { "name": "Currency", "type": "String" }
                              ],
                              "rows": [
                                [ 10.0, "Storage", "USD" ]
                              ],
                              "nextLink": "REPEATING_LINK"
                            }
                          }
                          """.Replace("REPEATING_LINK", repeatingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current > 3)
                {
                    throw new InvalidOperationException(
                        "Test hang guard: ActualCost query did not stop on repeating nextLink.");
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(pageBody, Encoding.UTF8, "application/json")
                    });
            });

        HostedAzureManagementPostReadClient client = new(
            new HttpClient(handler),
            NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.NotNull(summary);
        Assert.Equal(20.0, summary.TotalActualCostUsd);
        Assert.Single(summary.BreakdownByServiceName);
        Assert.Equal("Storage", summary.BreakdownByServiceName[0].ServiceName);
    }

    [Fact]
    public async Task TryQueryActualCostSummaryAsync_parses_numeric_cost_cells_invariantly()
    {
        CultureInfo originalCulture = CultureInfo.CurrentCulture;
        CultureInfo originalUiCulture = CultureInfo.CurrentUICulture;

        try
        {
            CultureInfo culture = CultureInfo.GetCultureInfo("de-DE");
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;

            const string responseBody = """
                                        {
                                          "properties": {
                                            "columns": [
                                              { "name": "PreTaxCost", "type": "Number" },
                                              { "name": "ServiceName", "type": "String" },
                                              { "name": "Currency", "type": "String" }
                                            ],
                                            "rows": [
                                              [ 10.5, "Storage", "USD" ]
                                            ]
                                          }
                                        }
                                        """;

            HttpMessageHandler handler = new RecordingHandler(
                (_, _) => Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
                    }));
            HostedAzureManagementPostReadClient client = new(
                new HttpClient(handler),
                NullLogger<HostedAzureManagementPostReadClient>.Instance);

            HostedAzureActualCostSummary? summary = await client.TryQueryActualCostSummaryAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                CancellationToken.None);

            Assert.NotNull(summary);
            Assert.Equal(10.5, summary.TotalActualCostUsd);
            Assert.Equal(10.5, Assert.Single(summary.BreakdownByServiceName).PreTaxCost);
        }
        finally
        {
            CultureInfo.CurrentCulture = originalCulture;
            CultureInfo.CurrentUICulture = originalUiCulture;
        }
    }

    private sealed class RecordingHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            responder(request, cancellationToken);
    }
}
