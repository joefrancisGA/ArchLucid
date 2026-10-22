"""Appendix A listings: the lab's pay-reconcile function.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/appa_function_app.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region function_app
import os

import azure.functions as func
from azure.identity import ManagedIdentityCredential
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route(route="reconcile")
def reconcile(req: func.HttpRequest) -> func.HttpResponse:
    """List settlement files using the attached identity named in AZURE_CLIENT_ID."""
    account = os.environ["ARCHIVE_ACCOUNT"]
    credential = ManagedIdentityCredential(client_id=os.environ["AZURE_CLIENT_ID"])
    service = BlobServiceClient(f"https://{account}.blob.core.windows.net", credential=credential)
    names = [blob.name for blob in service.get_container_client("settlements").list_blobs()]

    return func.HttpResponse(f"{len(names)} settlement files")
# endregion function_app
