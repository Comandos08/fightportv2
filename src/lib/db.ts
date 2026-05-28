// Untyped Supabase access for tables/views deployed outside the generated types.
// Use this for `people`, `people_public`, `person_schools`, `achievements_public`, etc.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as any;
