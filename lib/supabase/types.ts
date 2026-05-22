export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image_url: string | null;
  delivery_file_id: string | null;
  delivery_file_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type Order = {
  id: string;
  user_id: number;
  product_id: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  invoice_payload: string | null;
  telegram_payment_charge_id: string | null;
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      products: TableDef<
        Product,
        Omit<Product, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        },
        Partial<Product>
      >;
      orders: TableDef<
        Order,
        Omit<Order, "id" | "created_at" | "updated_at" | "paid_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          paid_at?: string | null;
        },
        Partial<Order>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
