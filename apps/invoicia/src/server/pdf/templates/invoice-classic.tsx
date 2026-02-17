import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { InvoicePdfData } from "@/server/pdf/types";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Times-Roman" },
  header: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: 700 },
  small: { fontSize: 9, color: "#3f3f46" },
  tableHeader: { flexDirection: "row", marginTop: 14, borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 6 },
  row: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  colDesc: { width: "56%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnitPrice: { width: "14%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  watermark: { position: "absolute", top: 280, left: 110, fontSize: 60, color: "#e5e7eb" },
  qr: { width: 84, height: 84 },
});

export function InvoiceClassicPdf(data: InvoicePdfData) {
  const watermark = data.invoice.status === "PAID" ? "PAID" : data.invoice.status === "VOID" ? "VOID" : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark ? <Text style={styles.watermark}>{watermark}</Text> : null}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.small}>{data.invoice.number}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>{data.org.name}</Text>
            {data.org.address ? <Text style={styles.small}>{data.org.address}</Text> : null}
            {data.org.email ? <Text style={styles.small}>{data.org.email}</Text> : null}
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.small}>BILL TO</Text>
          <Text>{data.customer.name}</Text>
          {data.customer.email ? <Text style={styles.small}>{data.customer.email}</Text> : null}
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.small}>ISSUE DATE</Text>
          <Text>{data.invoice.issueDate}</Text>
          {data.invoice.dueDate ? (
            <>
              <Text style={[styles.small, { marginTop: 6 }]}>DUE DATE</Text>
              <Text>{data.invoice.dueDate}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colUnitPrice}>Unit</Text>
          <Text style={styles.colTotal}>Amount</Text>
        </View>
        {data.lines.map((l, idx) => (
          <View style={styles.row} key={idx}>
            <Text style={styles.colDesc}>{l.description}</Text>
            <Text style={styles.colQty}>{l.quantity}</Text>
            <Text style={styles.colUnitPrice}>{(l.unitPriceCents / 100).toFixed(2)}</Text>
            <Text style={styles.colTotal}>{(l.lineTotalCents / 100).toFixed(2)}</Text>
          </View>
        ))}

        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
          <Text>Subtotal: {(data.totals.subtotalCents / 100).toFixed(2)}</Text>
          <Text>Tax: {(data.totals.taxCents / 100).toFixed(2)}</Text>
          <Text>Discount: -{(data.totals.discountCents / 100).toFixed(2)}</Text>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>
            Total: {(data.totals.totalCents / 100).toFixed(2)}
          </Text>
          <Text>Paid: {(data.totals.paidCents / 100).toFixed(2)}</Text>
          <Text style={{ fontWeight: 700 }}>
            Due: {(data.totals.dueCents / 100).toFixed(2)}
          </Text>
        </View>

        <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ maxWidth: 360 }}>
            <Text style={styles.small}>PAY ONLINE</Text>
            <Text>{data.hostedUrl}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {data.qrDataUrl ? <Image style={styles.qr} src={data.qrDataUrl} /> : null}
        </View>
      </Page>
    </Document>
  );
}
