import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // service key here!
);

export async function deleteUser(user: any) {
  if (!confirm(`Una uhakika unataka kufuta ${user.email}?`)) return;
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find((u) => u.email === user.email);
    if (authUser) await supabase.auth.admin.deleteUser(authUser.id);
    await supabase.from("users").delete().eq("id", user.id);
    alert(`✅ ${user.email} amefutwa.`);
  } catch (err) {
    console.error(err);
    alert("❌ Haikuwezekana kufuta mtumiaji.");
  }
}
