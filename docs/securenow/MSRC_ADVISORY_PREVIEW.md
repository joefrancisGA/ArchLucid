# MSRC CSAF/VEX dry-run preview

Run `python -m scripts.securenow.msrc_advisory_preview --url URL --cve CVE-ID --product-id PRODUCT-ID`
with the exact JSON document URL and CSAF product ID. Microsoft lists the advisory and VEX
distribution directories in its [CSAF provider metadata](https://msrc.microsoft.com/csaf/provider-metadata.json).

This preview preserves the exact CVE and product status, publisher revision, timestamp,
source URL, and hash of the fetched bytes. It accepts only HTTPS document URLs from the MSRC
distribution, does not follow redirects, and checks the declared publisher in the document.
This is direct HTTPS provenance, not detached OpenPGP signature verification.

A missing status means unknown. A vendor `fixed` status does not establish that a customer
deployment was affected, patched, or has no work left. The output is a review candidate,
not a finding or remediation mutation. No scheduler, credentials, inventory join, API write,
or legacy record migration is configured by this command.
