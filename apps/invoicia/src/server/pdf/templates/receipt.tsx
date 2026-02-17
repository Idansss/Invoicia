import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ReceiptPdfData } from "@/server/pdf/types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700 },
  muted: { color: "#52525b" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  box: { marginTop: 16, padding: 12, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 12 },
});

export function ReceiptPdf(data: ReceiptPdfData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Receipt</Text>
        <Text style={styles.muted}>{data.orgName}</Text>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.muted}>Receipt</Text>
            <Text>{data.receiptNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Invoice</Text>
            <Text>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Paid at</Text>
            <Text>{data.paidAt}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Amount</Text>
            <Text style={{ fontWeight: 700 }}>{(data.paidCents / 100).toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.muted}>Hosted invoice link</Text>
          <Text>{data.hostedUrl}</Text>
        </View>
      </Page>
    </Document>
  );
}

