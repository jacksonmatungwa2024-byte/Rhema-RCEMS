"use client"
import React from "react"

export default function LockedPage() {
  return (
    <div className="locked-container" style={{ textAlign: "center", padding: "40px" }}>
      <h1>🔒 Mfumo umefungwa</h1>
      <p>
        Samahani, mfumo wa RCEMS umefungwa kwa muda na admin.
        <br />
        Tafadhali jaribu tena baadaye.
      </p>
      <button
        onClick={() => (window.location.href = "/login")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          background: "#3b82f6",
          color: "white",
          cursor: "pointer",
        }}
      >
        Rudi kwenye Login
      </button>
    </div>
  )
}
