"use client";

import UserCard from "./UserCard";

interface UserListProps {
  users: any[];
  onDelete: (id: number, email: string) => void;
  onGenerateOtp: (id: number, email: string, countryCode: string) => void;
  onApprove: (id: number) => void;
  saving: boolean;
}

export default function UserList({ users, onDelete, onGenerateOtp, onApprove, saving }: UserListProps) {
  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onDelete={onDelete}
          onGenerateOtp={onGenerateOtp}
          onApprove={onApprove}
          saving={saving}
        />
      ))}
    </div>
  );
}
