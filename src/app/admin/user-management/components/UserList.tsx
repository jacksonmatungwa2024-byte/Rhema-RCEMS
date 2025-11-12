"use client";

import React from "react";
import UserCard from "./UserCard";

interface Props {
  users: any[];
  refreshUsers: () => void;
}

export default function UserList({ users, refreshUsers }: Props) {
  return (
    <div className="user-list">
      {users.map((u) => (
        <UserCard key={u.id} user={u} refreshUsers={refreshUsers} />
      ))}
    </div>
  );
}
