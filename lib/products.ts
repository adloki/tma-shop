import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/types";

type ProductRow = Record<string, unknown>;

function mapProductRow(row: ProductRow): Product | null {
  const id = row.id;
  const name = row.name ?? row.title;

  if (id == null || name == null) return null;

  const priceRaw = row.price ?? row.price_cents ?? row.amount ?? 0;
  const price = Number(priceRaw);

  return {
    id: String(id),
    name: String(name),
    description:
      row.description != null ? String(row.description) : null,
    price: Number.isFinite(price) ? price : 0,
    currency: row.currency != null ? String(row.currency) : null,
    image_url:
      row.image_url != null
        ? String(row.image_url)
        : row.photo_url != null
          ? String(row.photo_url)
          : null,
    delivery_file_id:
      row.delivery_file_id != null ? String(row.delivery_file_id) : null,
    delivery_file_url:
      row.delivery_file_url != null
        ? String(row.delivery_file_url)
        : row.file_url != null
          ? String(row.file_url)
          : null,
    is_active: row.is_active !== false,
    created_at:
      row.created_at != null ? String(row.created_at) : new Date().toISOString(),
  };
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    console.error("[products] Supabase error:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapProductRow(row as ProductRow))
    .filter((product): product is Product => product !== null)
    .filter((product) => product.is_active);
}
