"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import "./UserRegistration.css"; // ✅ External CSS

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserRegistration() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "user",
    branch: "",
    branch_custom: "",
    bio: "",
    password: "",
    profileFile: null as File | null
  });

  const [branches, setBranches] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAssignButton, setShowAssignButton] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadBranchesAndUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("branch, full_name, email, role, profile_url");

      if (!error && data) {
        const uniqueBranches = Array.from(new Set(data.map(u => u.branch).filter(Boolean)));
        setBranches(uniqueBranches);
        setUsers(data);
      }
    };

    loadBranchesAndUsers();
  }, []);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateUsername = async (base: string) => {
    let username = base.toLowerCase().replace(/\s+/g, "");
    let suffix = 1;

    while (true) {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (!data) break;
      username = `${base}${suffix}`;
      suffix++;
    }

    return username;
  };

  const uploadProfileImage = async (file: File, username: string) => {
    const filePath = `profiles/${username}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("profiles").upload(filePath, file);
    if (error) return null;
    const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage("");
    setShowAssignButton(false);

    const { full_name, email, phone, role, branch, branch_custom, bio, password, profileFile } = form;
    const finalBranch = branch_custom || branch;

    if (!email || !password || !full_name) {
      setMessage("❌ Tafadhali jaza jina, barua pepe na nenosiri.");
      setSaving(false);
      return;
    }

    const username = await generateUsername(full_name.split(" ")[0]);
    const profileUrl = profileFile ? await uploadProfileImage(profileFile, username) : null;

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      setMessage(`❌ Auth error: ${authError.message}`);
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("users")
      .insert([{
        username,
        full_name,
        email,
        phone,
        role,
        branch: finalBranch,
        bio,
        profile_url: profileUrl,
        is_active: true,
        metadata: { allowed_tabs: [] }
      }]);

    if (dbError) {
      setMessage(`❌ DB error: ${dbError.message}`);
      setSaving(false);
      return;
    }

    if (!branches.includes(finalBranch) && finalBranch) {
      setBranches(prev => [...prev, finalBranch]);
    }

    setMessage(`✅ ${full_name} ameandikishwa kama ${role}.`);
    setForm({
      full_name: "",
      email: "",
      phone: "",
      role: "user",
      branch: "",
      branch_custom: "",
      bio: "",
      password: "",
      profileFile: null
    });
    setShowAssignButton(true);
    setSaving(false);
  };

  return (
    <div className="user-registration-container">
      <h2>📝 Usajili wa Mtumiaji Mpya</h2>

      <div className="form-group">
        <input type="text" placeholder="🧍 Full Name" value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} />
        <input type="email" placeholder="📧 Email" value={form.email} onChange={e => handleChange("email", e.target.value)} />

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="🔒 Password"
            value={form.password}
            onChange={e => handleChange("password", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="toggle-password"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <input type="text" placeholder="📞 Phone" value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
        <select value={form.role} onChange={e => handleChange("role", e.target.value)}>
          <option value="user">User</option>
          <option value="usher">Usher</option>
          <option value="pastor">Pastor</option>
          <option value="media">Media</option>
          <option value="finance">Finance</option>
          <option value="admin">Admin</option>
        </select>
        <select value={form.branch} onChange={e => handleChange("branch", e.target.value)}>
          <option value="">Chagua tawi</option>
          {branches.map((b: string) => <option key={b} value={b}>{b}</option>)}
        </select>
        <input type="text" placeholder="✍️ Au andika tawi jipya" value={form.branch_custom} onChange={e => handleChange("branch_custom", e.target.value)} />
        <input type="text" placeholder="🧠 Bio" value={form.bio} onChange={e => handleChange("bio", e.target.value)} />
        <input type="file" accept="image/*" onChange={e => handleChange("profileFile", e.target.files?.[0] || null)} />

        <button className="submit-button" onClick={handleSubmit} disabled={saving}>
          📥 Sajili Mtumiaji
        </button>

        {message && <div className="message">{message}</div>}

        {showAssignButton && (
          <button className="assign-button" onClick={() => router.push("/admin-tabs")}>
            🛠️ Assign Tabs
          </button>
        )}
      </div>

      <hr className="divider" />

      <h3>👥 Watumiaji Waliosajiliwa</h3>
      <ul className="user-list">
        {users.map((u: any) => (
          <li key={u.email} className="user-item">
            {u.profile_url && <img src={u.profile_url} alt="profile" className="avatar" />}
            {u.full_name} ({u.role}) — {u.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
