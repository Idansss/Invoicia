import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function PasswordResetEmail(props: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Invoicia password</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", maxWidth: "480px" }}>
          <Heading style={{ margin: "0 0 16px", fontSize: "22px" }}>Reset your password</Heading>
          <Text style={{ margin: "0 0 16px", color: "#52525b" }}>
            We received a request to reset your Invoicia password. Click the button below to choose a new password.
            This link expires in 1 hour.
          </Text>
          <Button
            href={props.resetUrl}
            style={{
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: "600",
            }}
          >
            Reset password
          </Button>
          <Text style={{ margin: "24px 0 0", color: "#a1a1aa", fontSize: "13px" }}>
            If you did not request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
