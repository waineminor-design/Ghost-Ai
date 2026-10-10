import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Pure redirect on the session, so there is no static shell to prerender.
export const instant = false;

export default async function Home() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  redirect("/editor");
}
