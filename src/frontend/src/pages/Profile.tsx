import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Plus, Shield, Trash2, UserCircle, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { currentUser, logout, users, addUser, deleteUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    const trimmed = newUsername.trim();
    if (!trimmed || !newPassword) {
      setAddError("Username and password are required.");
      return;
    }
    if (users.find((u) => u.username === trimmed)) {
      setAddError("A user with that username already exists.");
      return;
    }
    addUser(trimmed, newPassword);
    setNewUsername("");
    setNewPassword("");
    setAddSuccess(`Staff member "${trimmed}" added successfully.`);
  };

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              }}
            >
              {currentUser?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">
                {currentUser?.username}
              </h1>
              <Badge
                className={`mt-1 text-xs font-semibold ${
                  currentUser?.role === "admin"
                    ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/40"
                    : "bg-emerald-500/30 text-emerald-200 border-emerald-400/40"
                }`}
                variant="outline"
              >
                {currentUser?.role === "admin" ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <UserCircle className="w-3 h-3 mr-1" />
                    Staff
                  </>
                )}
              </Badge>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="gap-2 shrink-0"
            data-ocid="profile.logout_button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Admin: User Management */}
      {currentUser?.role === "admin" && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-base text-foreground">
              User Management
            </h2>
          </div>

          {/* User List */}
          <div className="space-y-2">
            {users.map((user, idx) => (
              <div
                key={user.username}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 border border-border"
                data-ocid={`profile.row.${idx + 1}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-violet-600">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {user.username}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs mt-0.5 ${
                        user.role === "admin"
                          ? "text-indigo-600 border-indigo-300 bg-indigo-50"
                          : "text-emerald-600 border-emerald-300 bg-emerald-50"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={
                    user.username === currentUser.username ||
                    (user.role === "admin" && adminCount <= 1)
                  }
                  onClick={() => deleteUser(user.username)}
                  data-ocid={`profile.delete_button.${idx + 1}`}
                  title={
                    user.username === currentUser.username
                      ? "Cannot delete your own account"
                      : user.role === "admin" && adminCount <= 1
                        ? "Cannot delete the only admin"
                        : `Delete ${user.username}`
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Staff Form */}
          <form
            onSubmit={handleAddUser}
            className="space-y-3 pt-4 border-t border-border"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Add New Staff
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Username
                </Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Staff username"
                  className="h-9"
                  data-ocid="profile.username_input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Password
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password"
                  className="h-9"
                  data-ocid="profile.password_input"
                />
              </div>
            </div>

            {addError && (
              <p
                className="text-xs text-destructive"
                data-ocid="profile.error_state"
              >
                {addError}
              </p>
            )}
            {addSuccess && (
              <p
                className="text-xs text-success"
                data-ocid="profile.success_state"
              >
                {addSuccess}
              </p>
            )}

            <Button
              type="submit"
              size="sm"
              className="gap-2"
              data-ocid="profile.add_user_button"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
