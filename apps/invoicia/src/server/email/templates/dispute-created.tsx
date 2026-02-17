import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";

export function DisputeCreatedEmail(props: {
  orgName: string;
  invoiceNumber: string;
  reasonCode: string;
  message?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>New change request for {props.invoiceNumber}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px" }}>
          <Heading style={{ margin: "0 0 12px" }}>New change request</Heading>
          <Text style={{ margin: "0 0 12px" }}>
            A buyer submitted a change request for <strong>{props.invoiceNumber}</strong>.
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Reason: <strong>{props.reasonCode}</strong>
          </Text>
          {props.message ? (
            <Text style={{ margin: "0 0 12px" }}>Message: {props.message}</Text>
          ) : null}
          <Hr />
          <Text style={{ margin: "12px 0 0", color: "#71717a", fontSize: "12px" }}>
            Invoicia disputes are logged in the audit timeline.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

