import { query } from '../config/db.js';
function toOrder(row) {
    return {
        _id: row._id,
        id: row.id,
        userId: row.userId,
        queueNumber: row.queueNumber,
        items: row.items,
        status: row.status,
        totalPrice: Number(row.totalPrice),
        estimatedTime: row.estimatedTime,
        paymentStatus: row.paymentStatus || 'unpaid',
        paymentMethod: row.paymentMethod || 'cash',
        paymentIntentId: row.paymentIntentId || null,
        createdAt: row.createdAt,
    };
}
export async function createOrder(input) {
    const result = await query(`INSERT INTO orders (user_id, queue_number, items, status, total_price, estimated_time, payment_status, payment_method, payment_intent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"`, [
        input.userId,
        input.queueNumber,
        input.items,
        input.status ?? 'pending',
        input.totalPrice,
        input.estimatedTime,
        input.paymentStatus ?? 'unpaid',
        input.paymentMethod ?? 'cash',
        input.paymentIntentId ?? null,
    ]);
    return toOrder(result.rows[0]);
}
export async function findOrdersByUser(userId) {
    const result = await query(`SELECT
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC`, [userId]);
    return result.rows.map(toOrder);
}
export async function findOrderByIdForUser(orderId, userId) {
    const result = await query(`SELECT
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"
     FROM orders
     WHERE id = $1 AND user_id = $2
     LIMIT 1`, [orderId, userId]);
    if (result.rows.length === 0)
        return null;
    return toOrder(result.rows[0]);
}
export async function countActiveOrders() {
    const result = await query(`SELECT COUNT(*)::text AS count
     FROM orders
     WHERE status = ANY($1::text[])`, [['pending', 'preparing']]);
    return parseInt(result.rows[0].count, 10);
}
export async function averageActiveOrderTime() {
    const result = await query(`SELECT ROUND(AVG(estimated_time))::int AS "avgTime"
     FROM orders
     WHERE status = ANY($1::text[])`, [['pending', 'preparing']]);
    return result.rows[0].avgTime ?? 0;
}
export async function findAllQueueOrders() {
    const result = await query(`SELECT
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"
     FROM orders
     WHERE status = ANY($1::text[])
     ORDER BY queue_number ASC`, [['pending', 'preparing', 'ready']]);
    return result.rows.map((row) => ({
        _id: row._id,
        queueNumber: row.queueNumber,
        status: row.status,
        estimatedTime: row.estimatedTime,
        createdAt: row.createdAt,
        totalPrice: Number(row.totalPrice),
        paymentStatus: row.paymentStatus || 'unpaid',
        paymentMethod: row.paymentMethod || 'cash',
    }));
}
export async function findUserActiveOrder(userId) {
    const result = await query(`SELECT
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"
     FROM orders
     WHERE user_id = $1 AND status = ANY($2::text[])
     ORDER BY created_at DESC
     LIMIT 1`, [userId, ['pending', 'preparing', 'ready']]);
    if (result.rows.length === 0)
        return null;
    return toOrder(result.rows[0]);
}
export async function countOrdersAhead(queueNumber) {
    const result = await query(`SELECT COUNT(*)::text AS count
     FROM orders
     WHERE queue_number < $1 AND status = ANY($2::text[])`, [queueNumber, ['pending', 'preparing', 'ready']]);
    return parseInt(result.rows[0].count, 10);
}
export async function countOrdersInQueue() {
    const result = await query(`SELECT COUNT(*)::text AS count
     FROM orders
     WHERE status = ANY($1::text[])`, [['pending', 'preparing', 'ready']]);
    return parseInt(result.rows[0].count, 10);
}
export async function updateOrderStatus(orderId, status) {
    const result = await query(`UPDATE orders
     SET status = $2
     WHERE id = $1
     RETURNING
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"`, [orderId, status]);
    if (result.rows.length === 0)
        return null;
    return toOrder(result.rows[0]);
}
export async function findAllOrdersWithUser() {
    const result = await query(`SELECT
      o.id AS "_id",
      o.id,
      o.user_id AS "userId",
      o.queue_number AS "queueNumber",
      o.items,
      o.status,
      o.total_price AS "totalPrice",
      o.estimated_time AS "estimatedTime",
      o.payment_status AS "paymentStatus",
      o.payment_method AS "paymentMethod",
      o.payment_intent_id AS "paymentIntentId",
      o.created_at AS "createdAt",
      u.id AS "userRefId",
      u.username,
      u.display_name AS "displayName"
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`);
    return result.rows.map((row) => ({
        ...toOrder(row),
        userId: {
            _id: row.userRefId,
            username: row.username,
            displayName: row.displayName,
        },
    }));
}
export async function updateOrderPaymentStatus(orderId, paymentStatus, paymentMethod) {
    const result = await query(`UPDATE orders
     SET payment_status = $2${paymentMethod ? ', payment_method = $3' : ''}
     WHERE id = $1
     RETURNING
      id AS "_id",
      id,
      user_id AS "userId",
      queue_number AS "queueNumber",
      items,
      status,
      total_price AS "totalPrice",
      estimated_time AS "estimatedTime",
      payment_status AS "paymentStatus",
      payment_method AS "paymentMethod",
      payment_intent_id AS "paymentIntentId",
      created_at AS "createdAt"`, paymentMethod ? [orderId, paymentStatus, paymentMethod] : [orderId, paymentStatus]);
    if (result.rows.length === 0)
        return null;
    return toOrder(result.rows[0]);
}
export async function updateOrderStatusWithUser(orderId, status) {
    const result = await query(`UPDATE orders o
     SET status = $2
     FROM users u
     WHERE o.id = $1 AND u.id = o.user_id
     RETURNING
      o.id AS "_id",
      o.id,
      o.user_id AS "userId",
      o.queue_number AS "queueNumber",
      o.items,
      o.status,
      o.total_price AS "totalPrice",
      o.estimated_time AS "estimatedTime",
      o.payment_status AS "paymentStatus",
      o.payment_method AS "paymentMethod",
      o.payment_intent_id AS "paymentIntentId",
      o.created_at AS "createdAt",
      u.id AS "userRefId",
      u.username,
      u.display_name AS "displayName"`, [orderId, status]);
    if (result.rows.length === 0)
        return null;
    const row = result.rows[0];
    return {
        ...toOrder(row),
        userId: {
            _id: row.userRefId,
            username: row.username,
            displayName: row.displayName,
        },
    };
}
//# sourceMappingURL=Order.js.map