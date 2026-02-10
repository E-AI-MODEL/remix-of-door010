import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface School {
  VESTIGINGSNAAM?: string;
  INSTELLINGSNAAM?: string;
  STRAATNAAM?: string;
  "HUISNUMMER-TOEVOEGING"?: string;
  POSTCODE?: string;
  PLAATSNAAM?: string;
  GEMEENTENAAM?: string;
  INSTELLINGSCODE?: string;
  VESTIGINGSCODE?: string;
  INTERNETADRES?: string;
  DENOMINATIE?: string;
  [key: string]: unknown;
}

interface DuoSchoolsRow {
  id: string;
  sector: string;
  schools_data: School[];
  scraped_at: string;
  expires_at: string;
}

export function useSchools() {
  return useQuery({
    queryKey: ["duo-schools"],
    queryFn: async () => {
      // Check cache
      const { data: cached } = await supabase
        .from("duo_schools")
        .select("*")
        .gt("expires_at", new Date().toISOString());

      if (cached && cached.length > 0) {
        const rows = cached as unknown as DuoSchoolsRow[];
        return {
          sectors: rows.map((r) => ({
            sector: r.sector,
            schools: r.schools_data as School[],
          })),
          lastUpdated: rows[0]?.scraped_at,
          fromCache: true,
        };
      }

      // Trigger edge function
      const { data, error } = await supabase.functions.invoke("fetch-duo-schools");
      if (error) throw error;

      const rows = (data?.data || []) as DuoSchoolsRow[];
      return {
        sectors: rows.map((r) => ({
          sector: r.sector,
          schools: (r.schools_data || []) as School[],
        })),
        lastUpdated: new Date().toISOString(),
        fromCache: false,
      };
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useAffiliatedSchools() {
  return useQuery({
    queryKey: ["affiliated-schools"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-affiliated-schools");
      if (error) throw error;
      return data?.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
}
