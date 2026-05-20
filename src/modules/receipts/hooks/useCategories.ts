import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import type { FarmCategory } from "../types";

interface UseCategoriesResult {
  categories: FarmCategory[];
  loading: boolean;
  error: string | null;
}

/**
 * Le diretamente via supabase-js usando a sessao do user.
 * RLS allows is_preset=true OR scoped-to-org.
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<FarmCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("farm_categories")
        .select(
          "id, organization_id, slug, name, color, icon_lucide, direction, is_preset",
        )
        .order("name");

      if (!mounted) return;
      if (e) {
        setError(e.message);
        setCategories([]);
      } else {
        setCategories((data as FarmCategory[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading, error };
}
