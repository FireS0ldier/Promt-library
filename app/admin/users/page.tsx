import { createClient } from '@/lib/supabase/server';
import { AdminUserRow } from '@/components/admin/AdminUserRow';
import { formatDate } from '@/lib/utils';

export default async function AdminUsersPage() {
  const supabase = createClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground mt-1">{users?.length || 0} registered users</p>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Username</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.map((user: any) => (
              <AdminUserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
        {(!users || users.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">No users found.</div>
        )}
      </div>
    </div>
  );
}
