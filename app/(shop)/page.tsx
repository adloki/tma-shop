import { ProductCard } from "@/components/shop/product-card";
import { getActiveProducts } from "@/lib/products";

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-[var(--tg-theme-text-color,var(--foreground))]">
          Каталог
        </h1>
        <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {products.length > 0
            ? `${products.length} товаров`
            : "Товары скоро появятся"}
        </p>
      </header>

      {products.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--tg-theme-hint-color,var(--border))] p-8 text-center text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          Добавьте записи в таблицу{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">products</code>{" "}
          в Supabase.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
