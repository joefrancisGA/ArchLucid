# RF-ERR-02 — Do not call Azure Boards settings from the Security shell

**Wave:** Remediation factory dev log (**RF-ERR**). **Depends on:** none. **Branch:** `cursor/rf-err-skip-azure-boards-security`

## Goal

On the Security product line, opening `/security/remediation-factory` does not request `GET /v1/integrations/azure-boards/settings`. Architecture still requests it. The 403 gate stays.

## Why

The log shows:

`GET /api/proxy/v1/integrations/azure-boards/settings` **403**

`{"title":"Product line cannot use this route","detail":"The active product line cannot access this API route."}`

`AzureBoardsIntegrationsController` is `productLine: "architecture"` in `docs/architecture/data/product-capability-map.json`. `ProductLineRouteGateMiddleware` writes that problem details body when the effective line is Security. The same page load gets `GET /v1/integrations/itsm/health` **200** because that controller is `productLine: "both"`.

`OperatorLayoutClient` wraps every operator route in `ItsmNativeCreateReadinessProvider`. `loadItsmNativeCreateReadiness` always races `fetchItsmIntegrationHealth()` with `fetchAzureBoardsSettings()`. `Promise.allSettled` hides the rejection, so the page still renders and the proxy still logs `upstream_non_success`.

`ItsmNativeCreateReadinessProvider` is mounted **outside** `ProductLineProvider`. `useProductLine()` is unavailable there. `resolveProductLineId()` is.

## Read first

- `docs/architecture/REMEDIATION_FACTORY_DEV_ERROR_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/lib/itsm/itsm-native-integration.ts`
- `archlucid-ui/src/lib/itsm/itsm-native-integration.test.ts`
- `archlucid-ui/src/components/itsm/ItsmNativeCreateReadinessProvider.tsx`
- `archlucid-ui/src/app/(operator)/OperatorLayoutClient.tsx`
- `archlucid-ui/src/lib/product-line/resolve-product-line-id.ts`
- `archlucid-ui/src/lib/product-line/securenow-cloud-platform-policy.ts` (`isSecureNowProductLine`)
- `ArchLucid.Api/Middleware/ProductLineRouteGateMiddleware.cs`

## What to build

1. When `isSecureNowProductLine(resolveProductLineId())` is true, `loadItsmNativeCreateReadiness` does not call `fetchAzureBoardsSettings`. It still calls `fetchItsmIntegrationHealth()`. `azureBoardsReady` stays `false`. `defaultPathReady` still follows ITSM health via `isItsmNativeCreateDefaultPathReady`.
2. When the product line is Architecture, keep today’s `Promise.allSettled` of both calls and `isAzureBoardsNativeCreateReady` when the settings call fulfills.
3. Pass the product line into the loader as an argument (default `resolveProductLineId()`) so tests do not depend on `document.cookie`. Do not call `useProductLine()` from `ItsmNativeCreateReadinessProvider`.
4. Vitest in `itsm-native-integration.test.ts`: Security → `fetchAzureBoardsSettings` is not called, ITSM health is called once, `azureBoardsReady` is false. Architecture → settings are still fetched. The existing concurrent-dedupe test still passes.

## Do not

- Change `productLine` on `AzureBoardsIntegrationsController` from `architecture` to `both`.
- Swallow or special-case the 403 inside the proxy logger.
- Treat a 403 response as Azure Boards ready.
- Move the provider under `ProductLineProvider` unless the argument approach cannot see the cookie. Prefer the argument.

## Done when

A Security resolution issues no Azure Boards settings request, an Architecture resolution still does, and the named tests pass.
