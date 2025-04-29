import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Autocomplete } from "../components/Autocomplete";

export const Route = createFileRoute("/")({
  component: App,
});

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
  { id: 4, name: "Alice Brown", email: "alice@example.com" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com" },
];

export default function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Autocomplete Demo
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Basic Example
          </h2>
          <div className="max-w-md">
            <Autocomplete
              options={users}
              value={selectedUser}
              onChange={setSelectedUser}
              getOptionLabel={(user) => user.name}
              placeholder="Search users..."
            />
          </div>
          {selectedUser && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">
                Selected User:
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-900">
                  Name: {selectedUser.name}
                </p>
                <p className="text-sm text-gray-900">
                  Email: {selectedUser.email}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Custom Rendering
          </h2>
          <div className="max-w-md">
            <Autocomplete
              options={users}
              value={selectedUser}
              onChange={setSelectedUser}
              getOptionLabel={(user) => user.name}
              renderOption={(user) => (
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              )}
              placeholder="Search users with custom rendering..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
