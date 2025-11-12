import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function deleteUser(userId: number, email: string) {
  try {
    // Delete user from Supabase Auth
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email === email);
    if (authUser) await supabase.auth.admin.deleteUser(authUser.id);

    // Delete from users table
    await supabase.from("users").delete().eq("id", userId);

    alert("✅ Mtumiaji amefutwa kikamilifu.");
  } catch (err) {
    console.error(err);
    alert("❌ Tatizo kufuta mtumiaji.");
  }
}
