import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export function InvoiceSentEmail(props: {
  orgName: string;
  invoiceNumber: string;
  amountDueFormatted: string;
  dueDateFormatted?: string;
  hostedUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>
        Invoice {props.invoiceNumber} from {props.orgName}
      </Preview>
      <Body style={{ backgroundColor: "#f4f4f5", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px" }}>
          <Heading style={{ margin: "0 0 12px" }}>
            Invoice {props.invoiceNumber}
          </Heading>
          <Text style={{ margin: "0 0 12px" }}>
            You have a new invoice from <strong>{props.orgName}</strong>.
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Amount due: <strong>{props.amountDueFormatted}</strong>
            {props.dueDateFormatted ? ` • Due ${props.dueDateFormatted}` : ""}
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Pay and view details on the hosted invoice link:
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            <Link href={props.hostedUrl}>{props.hostedUrl}</Link>
          </Text>
          <Hr />
          <Text style={{ margin: "12px 0 0", color: "#71717a", fontSize: "12px" }}>
            Invoicia: hosted invoice links are the buyer experience. PDFs are renderings of structured invoice data.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

