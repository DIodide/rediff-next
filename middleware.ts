import { auth } from "@/auth";
import "@/env.mjs";

export default auth((request) => {
  if (!request.auth) {
    return Response.redirect(new URL("/", request.url));
  }
});

export const config = {
  matcher: ["/(loggedin.*)"],
};
