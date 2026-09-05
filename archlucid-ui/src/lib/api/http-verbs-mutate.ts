/** HTTP mutating verb helpers (POST, PATCH, PUT, DELETE). */

export {
  apiPostAcceptedWithLocation,
  apiPostJson,
  apiPostNoContent,
  apiPutJson,
  apiPutNoContent,
} from "./http-verbs-mutate-post";
export { apiPatchJson } from "./http-verbs-mutate-patch";
export { apiDelete } from "./http-verbs-mutate-delete";
