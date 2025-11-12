"use client";
import React from "react";
import UserCard from "./UserCard";

export default function UserList({ users, refresh }: any) {
  if (!users.length) return <p>Hakuna watumiaji waliopatikana.</p>;

  return (
    <div className="user-list">
      {users.map((user: any) => (
        <UserCard key={user.id} user={user} refresh={refresh} />
      ))}
    </div>
  );
}

