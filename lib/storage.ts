import { supabase } from "@/lib/supabase";

export interface DashboardPayload {
  title: string;
  query: string;
  insight?: string;
  chartData?: any[];
  tableData?: any[];
  chartRecommendation?: string;
}

export async function saveDashboardToDB(payload: DashboardPayload) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("dashboards")
    .insert([
      {
        user_id: user.id,
        title: payload.title,
        query: payload.query,
        insight: payload.insight ?? "",
        chart_data: payload.chartData ?? [],
        table_data: payload.tableData ?? [],
        chart_recommendation: payload.chartRecommendation ?? "bar",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDashboardsFromDB() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteDashboardFromDB(id: string) {
  const { error } = await supabase.from("dashboards").delete().eq("id", id);
  if (error) throw error;
}