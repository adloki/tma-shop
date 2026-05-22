import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function formatPrice(price: number, currency: string | null): string {
  const code = currency ?? "RUB";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(price);
}

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-[color-mix(in_oklch,var(--tg-theme-hint-color,var(--border))_35%,transparent)] bg-[var(--tg-theme-section-bg-color,var(--card))]",
        className,
      )}
    >
      {product.image_url ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 320px"
          />
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="text-[var(--tg-theme-text-color,var(--card-foreground))]">
          {product.name}
        </CardTitle>
        {product.description ? (
          <CardDescription className="line-clamp-2 text-[var(--tg-theme-subtitle-text-color,var(--muted-foreground))]">
            {product.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <Badge
          variant="secondary"
          className="bg-[var(--tg-theme-button-color,var(--secondary))] text-[var(--tg-theme-button-text-color,var(--secondary-foreground))]"
        >
          В наличии
        </Badge>
      </CardContent>
      <CardFooter className="border-[color-mix(in_oklch,var(--tg-theme-section-separator-color,var(--border))_50%,transparent)]">
        <span className="text-base font-semibold text-[var(--tg-theme-text-color,var(--foreground))]">
          {formatPrice(product.price, product.currency)}
        </span>
      </CardFooter>
    </Card>
  );
}
