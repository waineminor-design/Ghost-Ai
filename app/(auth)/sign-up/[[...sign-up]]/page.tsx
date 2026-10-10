import { SignUp } from "@clerk/nextjs";

import { authFormAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return <SignUp appearance={authFormAppearance} />;
}
