import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { InvoicePdfData } from "@/server/pdf/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  brand: { fontSize: 16, fontWeight: 700 },
  muted: { color: "#52525b" },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 6 },
  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: "#f4f4f5", fontSize: 9 },
  section: { marginTop: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 6, marginTop: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f4f4f5", paddingVertical: 6 },
  colDesc: { width: "44%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "10%", textAlign: "right" },
  colUnitPrice: { width: "16%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  totalsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e4e4e7" },
  watermark: { position: "absolute", top: 260, left: 80, fontSize: 64, color: "#e4e4e7" },
  qrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  qr: { width: 88, height: 88 },
});

export function InvoiceModernPdf(data: InvoicePdfData) {
  const watermark = data.invoice.status === "PAID" ? "PAID" : data.invoice.status === "VOID" ? "VOID" : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark ? <Text style={styles.watermark}>{watermark}</Text> : null}

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{data.org.name}</Text>
            {data.org.address ? <Text style={styles.muted}>{data.org.address}</Text> : null}
            {data.org.email ? <Text style={styles.muted}>{data.org.email}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.chip}>Invoice</Text>
            <Text style={{ marginTop: 6 }}>{data.invoice.number}</Text>
            <Text style={styles.muted}>Issued {data.invoice.issueDate}</Text>
            {data.invoice.dueDate ? <Text style={styles.muted}>Due {data.invoice.dueDate}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h1}>Invoice</Text>
          <Text style={styles.muted}>Bill to</Text>
          <Text>{data.customer.name}</Text>
          {data.customer.address ? <Text style={styles.muted}>{data.customer.address}</Text> : null}
          {data.customer.email ? <Text style={styles.muted}>{data.customer.email}</Text> : null}
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colUnit}>Unit</Text>
          <Text style={styles.colUnitPrice}>Unit price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {data.lines.map((l, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.colDesc}>{l.description}</Text>
            <Text style={styles.colQty}>{l.quantity}</Text>
            <Text style={styles.colUnit}>{l.unit}</Text>
            <Text style={styles.colUnitPrice}>{(l.unitPriceCents / 100).toFixed(2)}</Text>
            <Text style={styles.colTotal}>{(l.lineTotalCents / 100).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <View style={styles.row}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{(data.totals.subtotalCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Tax</Text>
            <Text>{(data.totals.taxCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Discount</Text>
            <Text>-{(data.totals.discountCents / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={{ fontWeight: 700 }}>Total</Text>
            <Text style={{ fontWeight: 700 }}>{(data.totals.totalCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Paid</Text>
            <Text>{(data.totals.paidCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Amount due</Text>
            <Text style={{ fontWeight: 700 }}>{(data.totals.dueCents / 100).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.qrRow}>
          <View style={{ maxWidth: 360 }}>
            <Text style={styles.muted}>Pay online</Text>
            <Text>{data.hostedUrl}</Text>
            {data.invoice.notes ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.muted}>Notes</Text>
                <Text>{data.invoice.notes}</Text>
              </View>
            ) : null}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {data.qrDataUrl ? <Image style={styles.qr} src={data.qrDataUrl} /> : null}
        </View>
      </Page>
    </Document>
  );
}
