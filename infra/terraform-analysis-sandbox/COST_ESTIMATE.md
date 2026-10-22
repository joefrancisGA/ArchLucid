# Analysis sandbox — monthly cost estimate (USD)

**Last reviewed:** 2026-09-18  
**Region assumption:** **Central US** (`centralus`)  
**Pricing basis:** Azure public list (pay-as-you-go). Enterprise discounts, credits, and currency FX are not modeled.

These numbers are **order-of-magnitude** for budgeting a throwaway analysis subscription — not an invoice. Validate in [Azure Cost Management](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview) after the first 48 hours.

## Default profile (`terraform.tfvars.example`)

| Resource | Configuration | Idle / low use (USD/mo) | What drives cost |
|----------|---------------|-------------------------|------------------|
| **Container Apps** (×4) | `minReplicas=0`, 0.25 vCPU / 0.5 GiB each | **$0–15** | $0 when scaled to zero; ~$5–15 per app if one replica runs 24×7 |
| **Container Apps Environment** | Public, linked to Log Analytics | **$0** | No separate CAE meter; LAW ingestion below |
| **Log Analytics** | 30-day retention, **1 GB/day cap** | **$2–5** | ~$2.30/GB ingested (cap limits surprise bills) |
| **Azure SQL** | **GP_S_Gen5_1**, auto-pause 60 min, 3× ~2 GB DBs | **$15–45** | Serverless compute when awake; storage ~$0.12/GB-mo; **3 databases multiply storage** |
| **Storage account** | Standard LRS, few GB | **$0.20–2** | Capacity + minimal transactions |
| **Key Vault** | Standard, RBAC, 2 secrets | **<$1** | Per-operation + secret renewal (negligible at sandbox volume) |
| **Data Factory** | Factory + linked services + pipeline **definition** | **$0–5 idle** | Factory is cheap idle; **pipeline runs** ~$1 per 1,000 activity runs if you trigger copies |
| **Service Bus** | **Off by default** | **$0** | — |
| **Service Bus** | Standard namespace + topic (**optional**) | **~$10** | Base Standard namespace charge dominates |
| **Event Grid** | **Off by default** | **$0** | First 100k ops/month often free when enabled |
| **Consumption budget** | Metadata only | **$0** | Alerts are free |

### Typical totals

| Scenario | `enable_data_factory` | `enable_service_bus` | Estimated total |
|----------|----------------------|----------------------|-----------------|
| **Idle analysis** (scaled to zero, SQL auto-paused, no pipeline runs) | true | false | **~$35–75 / month** |
| **Light use** (1 replica/API occasionally, SQL awake ~20% of time) | true | false | **~$60–120 / month** |
| **Messaging-rich** | true | true | add **~$10 / month** |
| **Aggressive cost cut** | false | false | **~$25–55 / month** (drop ADF; keep compute + SQL + storage) |

## Cost reduction knobs (before apply)

1. Set **`enable_data_factory = false`** if you only need Container Apps + SQL + storage edges (~$5–15/mo savings in pipeline-run scenarios; factory idle is small).
2. Keep **`enable_service_bus = false`** unless you need `Microsoft.ServiceBus/*` in diagrams (~$10/mo).
3. Use **`sql_sku_name = "Basic"`** and a **single database** (requires editing `sql.tf`) for the cheapest SQL — less representative of ArchLucid DEV.
4. Keep **`min_replicas = 0`** (default) and avoid load-testing the placeholder apps.
5. Set **`log_analytics_daily_quota_gb = 1`** (default) — do not remove the cap.
6. Set **`budget_contact_email`** + **`monthly_budget_usd`** (default 150) so Azure emails you before overrun.

## Tear-down and lingering charges

- **`terraform destroy`** removes billable resources in this root. Soft-deleted Key Vault names are purged on destroy (`purge_soft_delete_on_destroy`).
- **Log Analytics** may show trailing ingestion charges for up to 24h after delete.
- **SQL serverless** final storage GB persists until server deletion — destroy removes it.
- If you delete the subscription, all meters stop; allow up to 72h for final invoice alignment.

## Comparison to real ArchLucid DEV

Real DEV adds ACR pulls, Content Safety, optional OpenAI/Search, email, Front Door (staging/prod), and higher replica floors. This sandbox is intentionally **smaller** but **denser in diagram-relevant edge types per dollar** than an empty subscription.

See also [docs/deployment/PER_TENANT_COST_MODEL.md](../../docs/deployment/PER_TENANT_COST_MODEL.md) for production line-item methodology.
