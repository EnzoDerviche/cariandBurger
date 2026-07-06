export type UserRole = "super_admin" | "org_admin" | "staff";

export type BusinessHoursConfig = {
  enabled: boolean;
  closed_message: string | null;
  days: Partial<
    Record<
      "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
      { open: string; close: string }
    >
  >;
};

export type Organization = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  whatsapp_number: string;
  currency: string;
  order_prefix: string;
  theme_primary: string | null;
  theme_secondary: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationSettings = {
  organization_id: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  min_order_amount: number;
  payment_methods: string[];
  business_hours: BusinessHoursConfig | Record<string, unknown>;
  welcome_message: string | null;
  updated_at: string;
};

export type Profile = {
  id: string;
  organization_id: string | null;
  role: UserRole;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_promo: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ModifierGroup = {
  id: string;
  organization_id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  sort_order: number;
  created_at: string;
};

export type ModifierOption = {
  id: string;
  modifier_group_id: string;
  name: string;
  price: number;
  sort_order: number;
  is_active: boolean;
};

export type OrganizationInput = {
  slug: string;
  name: string;
  whatsapp_number: string;
  logo_url?: string;
  currency?: string;
  order_prefix?: string;
  theme_primary?: string;
  theme_secondary?: string;
  is_active?: boolean;
};

export type ActionState = {
  error?: string;
  success?: string;
};

export type OrderStatus = "pending" | "sent_whatsapp" | "confirmed" | "cancelled";
export type DeliveryMethod = "delivery" | "pickup";

export type Order = {
  id: string;
  organization_id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string | null;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  delivery_notes: string | null;
  scheduled_time: string;
  payment_method: string;
  subtotal: number;
  total: number;
  whatsapp_sent_at: string | null;
  created_at: string;
};

export type OrderItemModifier = {
  id: string;
  order_item_id: string;
  group_name: string;
  modifier_name: string;
  quantity: number;
  unit_price: number;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  order_item_modifiers: OrderItemModifier[];
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};
