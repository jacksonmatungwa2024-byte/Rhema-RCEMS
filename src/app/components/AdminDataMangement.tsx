"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./AdminDataManagement.css"; // ✅ External CSS

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDataManagement() {
  const [tables, setTables] = useState<{ name: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [primaryKey, setPrimaryKey] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const fetchTables = async () => {
      const { data, error } = await supabase.rpc("list_tables");
      if (!error && data) setTables(data);
    };
    fetchTables();
  }, []);

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setStatus("⏳ Inapakia data...");
    const { data, error } = await supabase.from(tableName).select("*");

    if (error) {
      setStatus("❌ Imeshindikana kupakia data.");
      return;
    }

    if (!data || data.length === 0) {
      setRows([]);
      setFormData({});
      setPrimaryKey("");
      setSelectedRows(new Set());
      setStatus("✅ Hakuna data kwenye jedwali hili.");
      return;
    }

    const sample = data[0];
    const key = Object.keys(sample).find(k => k === "id" || k.endsWith("_id")) || Object.keys(sample)[0];

    setPrimaryKey(key);
    setRows(data);
    setFormData(Object.fromEntries(Object.keys(sample).map(k => [k, ""])));
    setSelectedRows(new Set());
    setStatus("");
  };

  const resetSequence = async () => {
    const sequenceName = `${selectedTable}_id_seq`;
    const { error } = await supabase.rpc("reset_sequence", { seq_name: sequenceName });
    setStatus(error ? `❌ Imeshindikana: ${error.message}` : "✅ Namba imewekwa upya kuanzia 0.");
  };

  const saveEdit = async (rowId: string, column: string) => {
    setStatus("⏳ Inahifadhi mabadiliko...");
    const { error } = await supabase
      .from(selectedTable!)
      .update({ [column]: editValue })
      .eq(primaryKey, rowId);

    if (error) setStatus(`❌ Imeshindikana: ${error.message}`);
    else {
      setStatus("✅ Imesasishwa.");
      loadTableData(selectedTable!);
    }
    setEditingCell(null);
  };

  const handleInsert = async () => {
    if (!selectedTable) return;
    setStatus("⏳ Inatuma data mpya...");
    const { error } = await supabase.from(selectedTable).insert([formData]);
    setStatus(error ? `❌ Imeshindikana: ${error.message}` : "✅ Data mpya imeongezwa.");
    if (!error) loadTableData(selectedTable);
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedRows);
    const { error } = await supabase.from(selectedTable!).delete().in(primaryKey, ids);
    if (error) setStatus(`❌ Imeshindikana: ${error.message}`);
    else {
      setRows(prev => prev.filter(row => !selectedRows.has(row[primaryKey])));
      setSelectedRows(new Set());
      setStatus("✅ Rows zilizochaguliwa zimefutwa.");
    }
  };

 const deleteAll = async () => {
  if (!selectedTable) {
    setStatus("⚠️ Hakuna jedwali lililochaguliwa.");
    return;
  }

  const { error } = await supabase.rpc("delete_all_from_table", {
    table_name: selectedTable
  });

  if (error) {
    setStatus(`❌ Imeshindikana: ${error.message}`);
  } else {
    setRows([]);
    setSelectedRows(new Set());
    setStatus("✅ Data zote zimefutwa kupitia RPC.");
  }
};



  return (
    <div className="admin-data-panel">
      <h2>🧹 Usimamizi wa Data kwa Admin</h2>
      <p>Chagua jedwali, angalia data, hariri, ongeza au weka upya namba kwa hekima ya kiroho.</p>

      <div className="table-list">
        {tables.map(table => (
          <button key={table.name} onClick={() => loadTableData(table.name)}>
            📁 {table.name}
          </button>
        ))}
      </div>

      {selectedTable && (
        <div>
          <h3>📂 {selectedTable} ({rows.length} rows)</h3>

          {rows.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  {Object.keys(rows[0]).map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row[primaryKey]}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row[primaryKey])}
                        onChange={() => {
                          const copy = new Set(selectedRows);
                          copy.has(row[primaryKey]) ? copy.delete(row[primaryKey]) : copy.add(row[primaryKey]);
                          setSelectedRows(copy);
                        }}
                      />
                    </td>
                    {Object.keys(row).map(col => (
                      <td
                        key={col}
                        onClick={() => {
                          setEditingCell({ rowId: row[primaryKey], column: col });
                          setEditValue(String(row[col]));
                        }}
                      >
                        {editingCell?.rowId === row[primaryKey] && editingCell?.column === col ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(row[primaryKey], col)}
                            onKeyDown={e => e.key === "Enter" && saveEdit(row[primaryKey], col)}
                            autoFocus
                          />
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>✅ Hakuna data kwenye jedwali hili.</p>
          )}

          <div className="action-buttons">
            <button onClick={deleteSelected} disabled={selectedRows.size === 0}>
              🗑️ Futa Zilizochaguliwa ({selectedRows.size})
            </button>
            <button onClick={deleteAll}>🧨 Futa Data Zote</button>
            {primaryKey === "id" && (
              <button onClick={resetSequence}>🔄 Weka Upya Namba (Anza 0)</button>
            )}
          </div>

          <h4>➕ Ongeza Data Mpya</h4>
          <div className="insert-form">
            {Object.keys(formData).map(field => (
              <div key={field}>
                <label>{field}</label>
                <input
                  type="text"
                  value={formData[field]}
                  onChange={e =>
                    setFormData((prev: Record<string, string>) => ({
                      ...prev,
                      [field]: e.target.value
                    }))
                  }
                />
              </div>
            ))}
            <button onClick={handleInsert}>✅ Tuma Data</button>
          </div>

          {status && <div className="status-message">{status}</div>}
        </div>
      )}
    </div>
  );
}
