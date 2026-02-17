import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";

export function ReceiptEmail(props: {
  orgName: string;
  invoiceNumber: string;
  receiptNumber: string;
  amountPaidFormatted: string;
  hostedUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>
        Receipt {props.receiptNumber} for {props.invoiceNumber}
      </Preview>
      <Body style={{ backgroundColor: "#f4f4f5", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px" }}>
          <Heading style={{ margin: "0 0 12px" }}>Payment receipt</Heading>
          <Text style={{ margin: "0 0 12px" }}>
            Thanks — <strong>{props.amountPaidFormatted}</strong> was received by{" "}
            <strong>{props.orgName}</strong>.
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Invoice: <strong>{props.invoiceNumber}</strong>
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            Receipt number: <strong>{props.receiptNumber}</strong>
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            View invoice and download documents:
          </Text>
          <Text style={{ margin: "0 0 12px" }}>
            <Link href={props.hostedUrl}>{props.hostedUrl}</Link>
          </Text>
          <Hr />
          <Text style={{ margin: "12px 0 0", color: "#71717a", fontSize: "12px" }}>
            Invoicia receipts are generated from the same canonical structured invoice data.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

