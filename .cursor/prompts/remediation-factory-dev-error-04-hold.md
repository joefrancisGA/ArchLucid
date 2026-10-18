# RF-ERR-HOLD — Do not open Azure Boards to Security, and do not mute the 403

**Wave:** Remediation factory dev log (**RF-ERR**). **Not an implementation prompt.**

## Hold

1. Leave `ArchLucid.Api.Controllers.Integrations.AzureBoardsIntegrationsController` at `productLine: "architecture"` in `docs/architecture/data/product-capability-map.json`. Security must keep receiving **403** `Product line cannot use this route` if something still calls `/v1/integrations/azure-boards/settings`.
2. Leave `ProductLineRouteGateMiddleware` copy as it is: title `Product line cannot use this route`, detail `The active product line cannot access this API route.`
3. Leave the UI proxy `upstream_non_success` log. The defect is the Security shell issuing the request (**RF-ERR-02**), not the log line.
4. Do not treat ITSM health **200**, preferences **200** / **204**, learning plans **200**, or shell-status **200** as part of this failure.
5. Do not invent a second path-inspect panel id for the findings queue or finding inspect. Those callers stay without `id="remediation-factory-path-inspect"`.

## Done when

This file is read and none of the holds are implemented.
