/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as github from "../github.js";
import type * as github_actions from "../github_actions.js";
import type * as github_sync from "../github_sync.js";
import type * as http from "../http.js";
import type * as installations from "../installations.js";
import type * as myFunctions from "../myFunctions.js";
import type * as repos from "../repos.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  github: typeof github;
  github_actions: typeof github_actions;
  github_sync: typeof github_sync;
  http: typeof http;
  installations: typeof installations;
  myFunctions: typeof myFunctions;
  repos: typeof repos;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
