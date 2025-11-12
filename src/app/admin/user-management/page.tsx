"use client";
import React, { useEffect, useState } from "react";
import { fetchUsers } from "./actions/fetchUsers";
import UserList from "./UserList";
import "./UserManagement.css";

export default function Page() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      const data = await fetchUsers();
      setUsers(data);
      setLoading(false);
    };
    loadUsers();
  }, []);

  return (
    <div className="user-management-panel">
      <h2>🛠️ Usimamizi wa Watumiaji</h2>
      {loading ? (
        <p>⏳ Inapakia...</p>
      ) : (
        <UserList users={users} refresh={() => fetchUsers().then(setUsers)} />
      )}
    </div>
  );
}

