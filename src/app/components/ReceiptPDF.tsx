import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  pdf,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#f5f5f5",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    margin: "0 auto",
  },
  verse: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 6,
    color: "#555555",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#4a148c",
    textDecoration: "underline",
  },
  section: {
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: "1px solid #cccccc",
  },
  label: {
    fontWeight: "bold",
    color: "#0a174e",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 11,
    color: "#333333",
  },
  whatsapp: {
    color: "#2e7d32",
    fontSize: 11,
    marginTop: 6,
    textDecoration: "underline",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "25%",
    fontSize: 60,
    color: "#4a148c",
    opacity: 0.1,
    transform: "rotate(-30deg)",
  },
});

export const ReceiptPDF = ({
  data,
  headerLine,
}: {
  data: any;
  headerLine: string;
}) => {
  // Sanitize phone for WhatsApp (Tanzania format)
  let phone = data.simu?.replace(/[^0-9]/g, "") || "";
  if (phone.startsWith("0")) phone = "255" + phone.slice(1);
  else if (!phone.startsWith("255") && phone.length >= 9)
    phone = "255" + phone;

  const msg = encodeURIComponent(
    `Habari ${data.majina},\nAsante kwa mchango wako wa ${data.mchango_type}.\nUmelipa ${data.kiasi_lipwa.toLocaleString()} TZS.\nMungu akubariki! 🙏`
  );

  const whatsappLink = `https://wa.me/${phone}?text=${msg}`;

  return (
    <Document>
      <Page style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>RHEMA TANZANA</Text>

        {/* Header */}
        <View style={styles.header}>
          <Image src="/rhema.jpg" style={styles.logo} />
          <Text style={styles.verse}>{headerLine}</Text>
          <Text style={styles.title}>Risiti ya Mchango</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Majina: </Text> {data.majina}
          </Text>
          <Text>
            <Text style={styles.label}>Simu: </Text> {data.simu}
          </Text>
          <Text>
            <Text style={styles.label}>Mahali: </Text> {data.mahali}
          </Text>
          <Text>
            <Text style={styles.label}>Muumini Namba: </Text>{" "}
            {data.muumini_namba ?? "—"}
          </Text>
        </View>

        {/* Contribution Info */}
        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Aina ya Mchango: </Text> {data.mchango_type}
          </Text>
          <Text>
            <Text style={styles.label}>Lengo: </Text> {data.target}
          </Text>
          <Text>
            <Text style={styles.label}>Kiasi kilichopangwa: </Text>{" "}
            {data.kiasi_pangwa.toLocaleString()} TZS
          </Text>
          <Text>
            <Text style={styles.label}>Kiasi kilicholipwa: </Text>{" "}
            {data.kiasi_lipwa.toLocaleString()} TZS
          </Text>
          <Text>
            <Text style={styles.label}>Kiasi kilichopunguzwa: </Text>{" "}
            {data.kiasi_punguzo.toLocaleString()} TZS
          </Text>
          <Text>
            <Text style={styles.label}>Bado: </Text>{" "}
            {data.kiasi_bado.toLocaleString()} TZS
          </Text>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text>
            {data.kiasi_bado === 0
              ? "✅ Mchango umekamilika"
              : "⏳ Mchango bado unaendelea"}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Asante kwa mchango wako. Mungu akubariki 🙏</Text>
          <Text>Imepokelewa: {new Date().toLocaleDateString()}</Text>
          {data.simu && (
            <Link src={whatsappLink} style={styles.whatsapp}>
              📲 Tuma risiti kupitia WhatsApp
            </Link>
          )}
        </View>
      </Page>
    </Document>
  );
};

/**
 * Function ya kutuma risiti moja kwa moja WhatsApp ikiwa PDF.
 * Inatumia navigator.share kwenye vifaa vinavyounga mkono (simu / desktop modern browsers)
 */
export async function shareReceiptViaWhatsApp(data: any, headerLine: string) {
  try {
    // Generate PDF blob
    const blob = await pdf(<ReceiptPDF data={data} headerLine={headerLine} />).toBlob();

    const file = new File([blob], `Risiti_${data.majina}.pdf`, {
      type: "application/pdf",
    });

    // format phone for WhatsApp (Tanzania)
    let phone = data.simu?.replace(/[^0-9]/g, "") || "";
    if (phone.startsWith("0")) phone = "255" + phone.slice(1);
    else if (!phone.startsWith("255") && phone.length >= 9)
      phone = "255" + phone;

    const msg = `Habari ${data.majina},\nAsante kwa mchango wako wa ${data.mchango_type}.\nUmetoa ${data.kiasi_lipwa.toLocaleString()} TZS.\nMungu akubariki 🙏`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Risiti ya Mchango",
        text: msg,
        files: [file],
      });
    } else {
      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    }
  } catch (err) {
    console.error("⚠️ Hitilafu wakati wa kutuma WhatsApp:", err);
  }
}
