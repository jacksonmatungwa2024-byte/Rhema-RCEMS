export default function Blocked() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        color: "#FFD700",
        textAlign: "center",
        padding: "50px",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        🚫 Ufikiaji Umefungwa
      </h1>
      <p style={{ fontSize: "1.2rem", maxWidth: "600px" }}>
        Tovuti hii inaweza kufunguliwa tu kwa kutumia{" "}
        <strong>Google Chrome (Desktop au Android)</strong>.
      </p>

      <div style={{ marginTop: "2rem" }}>
        <p style={{ fontStyle: "italic" }}>
          “Imani yako iwe nuru ya safari yako.” ✨
        </p>
        <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
          — UCHAPAKAZI • JITIHADA • UVUMILIVU • IMANI
        </p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "#FFD700",
            color: "#000",
            padding: "10px 20px",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          📥 Pakua Google Chrome
        </a>
      </div>
    </div>
  );
}
