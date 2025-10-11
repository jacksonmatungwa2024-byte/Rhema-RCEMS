"use client"

import React, { useState } from "react"
import StorageOverview from "../components/StorageOverview"
import BucketExplorer from "../components/BucketExplorer"
import FileTable from "../components/FileTable"
import CleanupSuggestions from "../components/CleanupSuggestions"
import { useBucket } from "../components/BucketContext"
import "./StorageDashboard.css";

export default function StorageDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { selectedBucket } = useBucket();

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "buckets", label: "🗂️ Buckets" },
    { key: "files", label: "📁 Files" },
    { key: "cleanup", label: "🧹 Cleanup" }
  ];

  return (
    <div className="storage-dashboard-container">
      <h1>🧭 Supabase Storage Dashboard</h1>
      <p>Manage your database and bucket usage with clarity and legacy stewardship.</p>

      <div className="tab-buttons">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {selectedBucket && (
        <p>
          ✅ Selected bucket: <strong>{selectedBucket}</strong>
        </p>
      )}

      <div className="tab-content">
        {activeTab === "overview" && <StorageOverview />}
        {activeTab === "buckets" && <BucketExplorer />}
        {activeTab === "files" && selectedBucket ? (
          <FileTable />
        ) : activeTab === "files" ? (
          <p>Please select a bucket from the Buckets tab first.</p>
        ) : null}
        {activeTab === "cleanup" && selectedBucket ? (
          <CleanupSuggestions />
        ) : activeTab === "cleanup" ? (
          <p>Please select a bucket from the Buckets tab first.</p>
        ) : null}
      </div>
    </div>
  );
}
