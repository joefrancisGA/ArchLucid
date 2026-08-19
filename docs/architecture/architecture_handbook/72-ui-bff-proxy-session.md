# 72. UI BFF proxy session

OIDC tokens live in browser `sessionStorage`; the Next BFF proxy attaches Authorization or server API key and scope headers to ArchLucid.Api. Marketing paths strip privileged upstream auth so anonymous funnels never inherit operator credentials.

![UI BFF proxy session](../architecture_diagrams/archlucid-ui-bff-proxy-session.svg)
