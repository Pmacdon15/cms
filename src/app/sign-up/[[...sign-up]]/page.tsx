import { SignUp } from "@clerk/nextjs";
import AuthContainer from "@/components/AuthContainer";

export default function SignUpPage() {
  return (
    <AuthContainer>
      <SignUp />
    </AuthContainer>
  );
}
