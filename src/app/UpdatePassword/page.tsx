"use client";
export const dynamic = "force-dynamic"; // <-- tells Next.js: do not prerender

import UpdatePassword from "./UpdatePassword";

export default function Page() {
  return <UpdatePassword />;
}
