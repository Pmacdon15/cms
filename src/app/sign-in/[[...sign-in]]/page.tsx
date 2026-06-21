import { SignIn } from "@clerk/nextjs";
import AuthContainer from "@/components/AuthContainer";

export default function SignInPage() {
  return (
    <AuthContainer>
      <SignIn />
    </AuthContainer>
  );
}
