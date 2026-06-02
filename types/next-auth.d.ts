// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    default_split_percentage?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    default_split_percentage?: number;
  }
}
