import { SignIn } from "@clerk/nextjs";

import { authFormAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return <SignIn appearance={authFormAppearance} />;
}
