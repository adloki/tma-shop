import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Order, OrderStatus, Product } from "@/lib/supabase/types";

type OrderRow = Record<string, unknown>;

function mapOrderRow(row: OrderRow): Order | null {
  const id = row.id;
  const userId = row.user_id ?? row.telegram_user_id;
  const productId = row.product_id;
  const status = row.status;
  const amount = row.amount ?? row.total_amount ?? row.price;

  if (id == null || userId == null || productId == null || amount == null) {
    return null;
  }

  const parsedStatus = String(status ?? "pending") as OrderStatus;

  return {
    id: String(id),
    user_id: Number(userId),
    product_id: String(productId),
    status: parsedStatus,
    amount: Number(amount),
    currency: String(row.currency ?? "RUB"),
    invoice_payload:
      row.invoice_payload != null ? String(row.invoice_payload) : String(id),
    telegram_payment_charge_id:
      row.telegram_payment_charge_id != null
        ? String(row.telegram_payment_charge_id)
        : null,
    created_at:
      row.created_at != null ? String(row.created_at) : new Date().toISOString(),
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
    paid_at: row.paid_at != null ? String(row.paid_at) : null,
  };
}

function mapProductDelivery(row: Record<string, unknown>): Pick<
  Product,
  "id" | "name" | "delivery_file_id" | "delivery_file_url"
> | null {
  const id = row.id;
  if (id == null) return null;

  return {
    id: String(id),
    name: String(row.name ?? row.title ?? "Товар"),
    delivery_file_id:
      row.delivery_file_id != null ? String(row.delivery_file_id) : null,
    delivery_file_url:
      row.delivery_file_url != null
        ? String(row.delivery_file_url)
        : row.file_url != null
          ? String(row.file_url)
          : null,
  };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[orders] getOrderById:", error.message);
    return null;
  }

  if (!data) return null;
  return mapOrderRow(data as OrderRow);
}

export async function getProductDelivery(
  productId: string,
): Promise<Pick<Product, "id" | "name" | "delivery_file_id" | "delivery_file_url"> | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("[orders] getProductDelivery:", error.message);
    return null;
  }

  if (!data) return null;
  return mapProductDelivery(data as Record<string, unknown>);
}

export function validateOrderForCheckout(
  order: Order,
  params: {
    userId: number;
    currency: string;
    totalAmount: number;
    invoicePayload: string;
  },
): { ok: true } | { ok: false; reason: string } {
  if (order.status !== "pending") {
    return { ok: false, reason: "Заказ уже обработан" };
  }

  if (order.user_id !== params.userId) {
    return { ok: false, reason: "Заказ принадлежит другому пользователю" };
  }

  const expectedPayload = order.invoice_payload ?? order.id;
  if (expectedPayload !== params.invoicePayload && order.id !== params.invoicePayload) {
    return { ok: false, reason: "Неверный payload заказа" };
  }

  if (order.currency !== params.currency) {
    return { ok: false, reason: "Неверная валюта" };
  }

  if (order.amount !== params.totalAmount) {
    return { ok: false, reason: "Сумма не совпадает" };
  }

  return { ok: true };
}

export async function markOrderPaid(
  orderId: string,
  telegramPaymentChargeId: string,
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      telegram_payment_charge_id: telegramPaymentChargeId,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) {
    console.error("[orders] markOrderPaid:", error.message);
    return false;
  }

  return true;
}
