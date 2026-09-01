import { query } from '../config/db.js';

export type EventOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod =
  | 'razorpay_upi'
  | 'razorpay_card'
  | 'razorpay_netbanking'
  | 'razorpay'
  | 'cash'
  | 'stripe_card'
  | 'stripe_upi';

export interface EventOrderItem {
  itemId: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IEventOrder {
  _id: string;
  id: string;
  userId: string;
  eventName: string;
  eventDate: Date;
  location: string;
  attendeesCount: number;
  contactName: string;
  contactPhone: string;
  items: EventOrderItem[];
  specialInstructions: string;
  totalPrice: number;
  status: EventOrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string | null;
  createdAt: Date;
}

export interface IEventOrderWithUser extends Omit<IEventOrder, 'userId'> {
  user: {
    _id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
  };
}

interface EventOrderRow {
  _id: string;
  id: string;
  userId: string;
  eventName: string;
  eventDate: Date;
  location: string;
  attendeesCount: number;
  contactName: string;
  contactPhone: string;
  items: EventOrderItem[] | string;
  specialInstructions: string;
  totalPrice: number | string;
  status: EventOrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_intent_id?: string | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentIntentId?: string | null;
  createdAt: Date;
}

interface EventOrderWithUserRow extends EventOrderRow {
  userRefId: string;
  username: string;
  displayName: string;
  profilePicture?: string;
}

function parseItems(items: EventOrderItem[] | string): EventOrderItem[] {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return [];
}

function toEventOrder(row: EventOrderRow): IEventOrder {
  return {
    _id: row._id,
    id: row.id,
    userId: row.userId,
    eventName: row.eventName,
    eventDate: new Date(row.eventDate),
    location: row.location,
    attendeesCount: Number(row.attendeesCount),
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    items: parseItems(row.items),
    specialInstructions: row.specialInstructions || '',
    totalPrice: Number(row.totalPrice),
    status: row.status,
    paymentStatus: row.paymentStatus || row.payment_status || 'unpaid',
    paymentMethod: row.paymentMethod || row.payment_method || 'cash',
    paymentIntentId: row.paymentIntentId || row.payment_intent_id || null,
    createdAt: new Date(row.createdAt),
  };
}

export async function createEventOrder(input: {
  userId: string;
  eventName: string;
  eventDate: string | Date;
  location: string;
  attendeesCount: number;
  contactName: string;
  contactPhone: string;
  items: EventOrderItem[];
  specialInstructions?: string;
  totalPrice: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentIntentId?: string | null;
}): Promise<IEventOrder> {
  const result = await query<EventOrderRow>(
    `INSERT INTO event_orders (
      user_id,
      event_name,
      event_date,
      location,
      attendees_count,
      contact_name,
      contact_phone,
      items,
      special_instructions,
      total_price,
      status,
      payment_status,
      payment_method,
      payment_intent_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13)
    RETURNING
      id AS "_id",
      id,
      user_id AS "userId",
      event_name AS "eventName",
      event_date AS "eventDate",
      location,
      attendees_count AS "attendeesCount",
      contact_name AS "contactName",
      contact_phone AS "contactPhone",
      items,
      special_instructions AS "specialInstructions",
      total_price AS "totalPrice",
      status,
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"`,
    [
      input.userId,
      input.eventName.trim(),
      new Date(input.eventDate).toISOString(),
      input.location.trim(),
      input.attendeesCount || 1,
      input.contactName.trim(),
      input.contactPhone.trim(),
      JSON.stringify(input.items),
      input.specialInstructions?.trim() || '',
      input.totalPrice,
      input.paymentStatus || 'unpaid',
      input.paymentMethod || 'cash',
      input.paymentIntentId || null,
    ],
  );

  return toEventOrder(result.rows[0]);
}

export async function findEventOrdersByUser(userId: string): Promise<IEventOrder[]> {
  const result = await query<EventOrderRow>(
    `SELECT
      id AS "_id",
      id,
      user_id AS "userId",
      event_name AS "eventName",
      event_date AS "eventDate",
      location,
      attendees_count AS "attendeesCount",
      contact_name AS "contactName",
      contact_phone AS "contactPhone",
      items,
      special_instructions AS "specialInstructions",
      total_price AS "totalPrice",
      status,
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"
     FROM event_orders
     WHERE user_id = $1
     ORDER BY event_date ASC, created_at DESC`,
    [userId],
  );

  return result.rows.map(toEventOrder);
}

export async function findEventOrderById(id: string): Promise<IEventOrder | null> {
  const result = await query<EventOrderRow>(
    `SELECT
      id AS "_id",
      id,
      user_id AS "userId",
      event_name AS "eventName",
      event_date AS "eventDate",
      location,
      attendees_count AS "attendeesCount",
      contact_name AS "contactName",
      contact_phone AS "contactPhone",
      items,
      special_instructions AS "specialInstructions",
      total_price AS "totalPrice",
      status,
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"
     FROM event_orders
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  if (result.rows.length === 0) return null;
  return toEventOrder(result.rows[0]);
}

export async function findAllEventOrders(): Promise<IEventOrderWithUser[]> {
  const result = await query<EventOrderWithUserRow>(
    `SELECT
      e.id AS "_id",
      e.id,
      e.user_id AS "userId",
      e.event_name AS "eventName",
      e.event_date AS "eventDate",
      e.location,
      e.attendees_count AS "attendeesCount",
      e.contact_name AS "contactName",
      e.contact_phone AS "contactPhone",
      e.items,
      e.special_instructions AS "specialInstructions",
      e.total_price AS "totalPrice",
      e.status,
      e.payment_status AS "paymentStatus",
      e.payment_method AS "paymentMethod",
      e.payment_intent_id AS "paymentIntentId",
      e.created_at AS "createdAt",
      u.id AS "userRefId",
      u.username,
      u.display_name AS "displayName",
      u.profile_picture AS "profilePicture"
     FROM event_orders e
     JOIN users u ON e.user_id = u.id
     ORDER BY e.event_date ASC, e.created_at DESC`,
  );

  return result.rows.map((row) => ({
    _id: row._id,
    id: row.id,
    eventName: row.eventName,
    eventDate: new Date(row.eventDate),
    location: row.location,
    attendeesCount: Number(row.attendeesCount),
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    items: parseItems(row.items),
    specialInstructions: row.specialInstructions || '',
    totalPrice: Number(row.totalPrice),
    status: row.status,
    paymentStatus: row.paymentStatus || 'unpaid',
    paymentMethod: row.paymentMethod || 'cash',
    paymentIntentId: row.paymentIntentId || null,
    createdAt: new Date(row.createdAt),
    user: {
      _id: row.userRefId,
      username: row.username,
      displayName: row.displayName || row.username,
      profilePicture: row.profilePicture || '',
    },
  }));
}

export async function updateEventOrderPaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: PaymentMethod,
): Promise<IEventOrder | null> {
  const result = await query<EventOrderRow>(
    `UPDATE event_orders
     SET payment_status = $2${paymentMethod ? ', payment_method = $3' : ''}
     WHERE id = $1
     RETURNING
      id AS "_id",
      id,
      user_id AS "userId",
      event_name AS "eventName",
      event_date AS "eventDate",
      location,
      attendees_count AS "attendeesCount",
      contact_name AS "contactName",
      contact_phone AS "contactPhone",
      items,
      special_instructions AS "specialInstructions",
      total_price AS "totalPrice",
      status,
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"`,
    paymentMethod ? [id, paymentStatus, paymentMethod] : [id, paymentStatus],
  );

  if (result.rows.length === 0) return null;
  return toEventOrder(result.rows[0]);
}

export async function updateEventOrderStatus(
  id: string,
  status: EventOrderStatus,
): Promise<IEventOrder | null> {
  const result = await query<EventOrderRow>(
    `UPDATE event_orders
     SET status = $2
     WHERE id = $1
     RETURNING
      id AS "_id",
      id,
      user_id AS "userId",
      event_name AS "eventName",
      event_date AS "eventDate",
      location,
      attendees_count AS "attendeesCount",
      contact_name AS "contactName",
      contact_phone AS "contactPhone",
      items,
      special_instructions AS "specialInstructions",
      total_price AS "totalPrice",
      status,
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"`,
    [id, status],
  );

  if (result.rows.length === 0) return null;
  return toEventOrder(result.rows[0]);
}
