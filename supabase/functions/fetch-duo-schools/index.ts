import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DUO_API = "https://onderwijsdata.duo.nl/api/action/datastore_search";

const RESOURCES = [
  { sector: "PO", resource_id: "dcc9c9a5-6d01-410b-967f-810557588ba4" },
  { sector: "VO", resource_id: "5187f8d5-ff9c-4284-8e06-4311f0354956" },
  { sector: "MBO", resource_id: "1a946297-a7ca-48d5-9ae8-19ad73bf8176" },
];

async function fetchDuoData(resourceId: string, gemeente = "Rotterdam") {
  // First try with filter, if 409 then fetch all and filter locally
  const filters = JSON.stringify({ GEMEENTE: gemeente });
  let url = `${DUO_API}?resource_id=${resourceId}&filters=${encodeURIComponent(filters)}&limit=1000`;
  console.log("Fetching DUO:", url);
  let res = await fetch(url);

  if (res.status === 409) {
    // Filter field might not exist, try with 'q' search parameter
    url = `${DUO_API}?resource_id=${resourceId}&q=${encodeURIComponent(gemeente)}&limit=1000`;
    console.log("Retrying with q param:", url);
    res = await fetch(url);
  }

  if (!res.ok) {
    // Last resort: fetch all records and filter locally
    url = `${DUO_API}?resource_id=${resourceId}&limit=1000`;
    console.log("Fetching all records:", url);
    res = await fetch(url);
  }

  if (!res.ok) throw new Error(`DUO API error: ${res.status}`);
  const json = await res.json();
  const records = json.result?.records || [];

  // Filter locally for gemeente Rotterdam (case-insensitive, check multiple field names)
  const filtered = records.filter((r: Record<string, unknown>) => {
    const g = (r.GEMEENTE || r.gemeente || r.Gemeente || "") as string;
    return g.toLowerCase().includes(gemeente.toLowerCase());
  });
  console.log(`Got ${records.length} total, ${filtered.length} for ${gemeente}`);
  return filtered.length > 0 ? filtered : records;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("duo_schools")
      .select("*")
      .gt("expires_at", new Date().toISOString());

    if (cached && cached.length === 3) {
      console.log("Returning cached DUO data");
      return new Response(JSON.stringify({ success: true, data: cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch fresh data from DUO for all 3 sectors in parallel
    const results = await Promise.all(
      RESOURCES.map(async ({ sector, resource_id }) => {
        const records = await fetchDuoData(resource_id);
        return { sector, records };
      })
    );

    // Delete old cache and insert new
    await supabase.from("duo_schools").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const inserts = results.map(({ sector, records }) => ({
      sector,
      schools_data: records,
      scraped_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { error: insertError } = await supabase.from("duo_schools").insert(inserts);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to cache: ${insertError.message}`);
    }

    console.log(`Cached ${results.map((r) => `${r.sector}: ${r.records.length}`).join(", ")}`);

    const { data: freshData } = await supabase.from("duo_schools").select("*");

    return new Response(JSON.stringify({ success: true, data: freshData, fromCache: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
