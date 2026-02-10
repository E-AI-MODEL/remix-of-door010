const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGES = [
  {
    sector: "PO",
    url: "https://www.onderwijsregio.nl/documenten/2024/06/05/lijst-van-aangesloten-vestigingen-van-onderwijsregio-rotterdam-po---2024",
  },
  {
    sector: "VO/MBO",
    url: "https://www.onderwijsregio.nl/documenten/2024/06/05/lijst-van-aangesloten-vestigingen-van-onderwijsregio-rotterdam-vo-mbo---2024",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.all(
      PAGES.map(async ({ sector, url }) => {
        console.log(`Scraping affiliated schools for ${sector}:`, url);
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error(`Firecrawl error for ${sector}:`, data);
          return { sector, markdown: "", names: [] };
        }

        const markdown = data.data?.markdown || data.markdown || "";

        // Extract school/institution names from the markdown
        // The lists typically contain BRIN codes and school names
        const lines = markdown.split("\n").filter((l: string) => l.trim().length > 0);
        const names: string[] = [];
        for (const line of lines) {
          // Look for lines that contain BRIN-like codes (4 chars + 2 digits pattern)
          const brinMatch = line.match(/([A-Z0-9]{4}\d{2})/);
          if (brinMatch) {
            // Extract the name part (usually after the BRIN code)
            const cleaned = line.replace(/[|*_#]/g, "").trim();
            names.push(cleaned);
          } else if (line.match(/^[-•]\s+/) || line.match(/^\d+\.\s+/)) {
            // Bullet or numbered list items
            const cleaned = line.replace(/^[-•\d.]+\s+/, "").replace(/[|*_#]/g, "").trim();
            if (cleaned.length > 3) names.push(cleaned);
          }
        }

        console.log(`Found ${names.length} entries for ${sector}`);
        return { sector, markdown, names };
      })
    );

    return new Response(JSON.stringify({ success: true, data: results }), {
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
