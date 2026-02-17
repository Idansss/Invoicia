import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export function ReminderEmail(props: {
  orgName: string;
  invoiceNumber: string;
  amountDueFormatted: string;
  dueDateFormatted?: string;
  hostedUrl: string;
  tone: "friendly" | "firm";
}) {
  const subjectLine =
    props.tone === "firm"
      ? "Payment reminder"
      : "Friendly reminder";

  return (
    <Html>
      <Head />
      <Preview>
        {subjectLine}: {props.invoiceNumber}
      </Preview>
      <Body style={{ backgroundColor: "#f4f4f5", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px" }}>
          <Heading style={{ margin: "0 0 12px" }}>{subjectLine}</Heading>
          <Text style={{ margin: "0 0 12px" }}>
            This is a {props.tone === "firm" ? "payment reminder" : "friendly reminder"} for invoice{" "}
            <strong>{props.invoiceNumber}</strong> from <strong>{props.orgName}</strong>.
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Amount due: <strong>{props.amountDueFormatted}</strong>
            {props.dueDateFormatted ? ` • Due ${props.dueDateFormatted}` : ""}
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Pay via the hosted invoice link:
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            <Link href={props.hostedUrl}>{props.hostedUrl}</Link>
          </Text>
          <Hr />
          <Text style={{ margin: "12px 0 0", color: "#71717a", fontSize: "12px" }}>
            Invoicia reminders are automated to reduce manual chasing.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

