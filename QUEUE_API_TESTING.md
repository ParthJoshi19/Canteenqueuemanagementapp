# Queue Management API - Testing & Usage Guide

## Quick Start: Testing the Order & Queue System

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173` (or appropriate port)
- User must be authenticated

---

## API Endpoints Reference

### 1. Place an Order
**POST** `/api/orders`

Creates a new order and assigns a queue number.

**Request:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: <your_auth_cookie>" \
  -d '{
    "items": ["menu_item_id_1", "menu_item_id_2"],
    "totalPrice": 25.50,
    "estimatedTime": 20
  }'
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "queueNumber": 42,
  "items": ["item1", "item2"],
  "status": "pending",
  "totalPrice": 25.50,
  "estimatedTime": 20,
  "createdAt": "2026-03-16T10:30:00.000Z"
}
```

**Status Codes:**
- `201` - Order created successfully
- `400` - Invalid request (empty items, invalid price/time)
- `401` - Not authenticated
- `500` - Server error

---

### 2. Get User's Orders
**GET** `/api/orders`

Lists all orders placed by the authenticated user, sorted by most recent first.

**Request:**
```bash
curl http://localhost:5000/api/orders \
  -H "Cookie: <your_auth_cookie>"
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "queueNumber": 42,
    "status": "preparing",
    "totalPrice": 25.50,
    "estimatedTime": 20,
    "createdAt": "2026-03-16T10:30:00.000Z"
  }
]
```

---

### 3. Get Queue Statistics
**GET** `/api/orders/queue/info`

Returns overall queue information (total active orders and average wait time).

**Request:**
```bash
curl http://localhost:5000/api/orders/queue/info \
  -H "Cookie: <your_auth_cookie>"
```

**Response (200):**
```json
{
  "currentQueue": 5,
  "averageWaitTime": 18
}
```

---

### 4. Get All Active Orders in Queue
**GET** `/api/orders/queue/all`

Lists all orders currently in queue (pending, preparing, ready) sorted by queue number.

**Request:**
```bash
curl http://localhost:5000/api/orders/queue/all \
  -H "Cookie: <your_auth_cookie>"
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "queueNumber": 40,
    "status": "preparing",
    "estimatedTime": 20,
    "createdAt": "2026-03-16T10:15:00.000Z",
    "items": ["item1", "item2"],
    "totalPrice": 25.50
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "queueNumber": 41,
    "status": "pending",
    "estimatedTime": 15,
    "createdAt": "2026-03-16T10:20:00.000Z",
    "items": ["item3"],
    "totalPrice": 12.00
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "queueNumber": 42,
    "status": "ready",
    "estimatedTime": 10,
    "createdAt": "2026-03-16T10:25:00.000Z",
    "items": ["item4", "item5"],
    "totalPrice": 35.00
  }
]
```

---

### 5. Get User's Queue Position
**GET** `/api/orders/queue/position`

Returns the authenticated user's position in the queue (only if user has an active order).

**Request:**
```bash
curl http://localhost:5000/api/orders/queue/position \
  -H "Cookie: <your_auth_cookie>"
```

**Response (200) - User has active order:**
```json
{
  "queueNumber": 42,
  "position": 3,
  "totalInQueue": 5,
  "status": "preparing",
  "estimatedTime": 20
}
```

**Response (200) - User has no active order:**
```json
{
  "queueNumber": null,
  "position": null,
  "totalInQueue": 0,
  "status": null,
  "estimatedTime": 0
}
```

---

### 6. Get Specific Order
**GET** `/api/orders/:id`

Retrieves details of a specific order (user can only access their own orders).

**Request:**
```bash
curl http://localhost:5000/api/orders/507f1f77bcf86cd799439011 \
  -H "Cookie: <your_auth_cookie>"
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "queueNumber": 42,
  "items": ["item1", "item2"],
  "status": "ready",
  "totalPrice": 25.50,
  "estimatedTime": 20,
  "createdAt": "2026-03-16T10:30:00.000Z"
}
```

**Status Codes:**
- `200` - Order found
- `404` - Order not found or doesn't belong to user
- `401` - Not authenticated

---

### 7. Update Order Status
**PATCH** `/api/orders/:id/status`

Updates the status of an order (typically used by admin/kitchen staff).

**Request:**
```bash
curl -X PATCH http://localhost:5000/api/orders/507f1f77bcf86cd799439011/status \
  -H "Content-Type: application/json" \
  -H "Cookie: <your_auth_cookie>" \
  -d '{
    "status": "preparing"
  }'
```

**Valid Status Values:**
- `pending` - Order received
- `preparing` - Being prepared in kitchen
- `ready` - Ready for pickup
- `completed` - Picked up

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "queueNumber": 42,
  "items": ["item1", "item2"],
  "status": "preparing",
  "totalPrice": 25.50,
  "estimatedTime": 20,
  "createdAt": "2026-03-16T10:30:00.000Z"
}
```

---

## Frontend Components Usage

### Cart Component
Located in: `frontend/src/app/components/cart.tsx`

**Props:**
```typescript
interface CartProps {
  items: CartItem[];                                    // Items in cart
  onRemoveItem: (id: string) => void;                  // Remove item callback
  onPlaceOrder: (confirmation: OrderConfirmation) => void;  // Order placed callback
  onClearCart: () => void;                             // Clear cart callback
}
```

**Features:**
- Shows cart items with quantities
- Real-time total price calculation
- Estimated time calculation (max of all items)
- One-click order placement
- Order confirmation modal with queue number

---

### Queue Display Component
Located in: `frontend/src/app/components/queue-display.tsx`

**Props:**
```typescript
interface QueueDisplayProps {
  refreshInterval?: number; // Auto-refresh interval in ms (default: 5000)
}
```

**Features:**
- Shows user's queue position and number
- Display all active orders in queue
- Shows queue statistics (total count, average wait)
- Real-time updates with auto-refresh
- Highlights user's own order
- Status badges for each order

---

## Testing Workflows

### Workflow 1: Basic Order Placement
1. User logs in
2. Adds items to cart
3. Clicks "Place Order"
4. Sees queue number confirmation (e.g., "#042")
5. Cart clears
6. Order appears in order tracking modal

### Workflow 2: View Queue
1. After placing order, user clicks "View Queue" button
2. Sees live queue display with:
   - Their position (e.g., "3 of 5")
   - Their status
   - List of all orders ahead and behind
3. Auto-refreshes every 5 seconds to show real-time updates

### Workflow 3: Order Status Updates
1. Admin updates order status to "preparing"
2. Customer sees:
   - Status updates in order tracking modal
   - Updated position in queue display (if applicable)
   - Toast notification when ready

### Workflow 4: Multiple Orders
1. Customer places multiple orders
2. Can only track the most recent active order
3. Previous orders show in order history
4. Only active order appears in queue display

---

## Example Flow: Complete Order Journey

```
1. Customer logs in
   → GET /api/auth/me (verify authentication)
   → GET /api/menu (load menu items)
   → GET /api/orders/queue/info (show queue count in header)

2. Customer adds items and places order
   → POST /api/orders
   → Response includes queueNumber: 42
   → Cart shows confirmation modal
   → Toast: "Order placed! Queue #042"

3. Customer wants to see queue
   → Click "View Queue" button
   → GET /api/orders/queue/all (get all orders)
   → GET /api/orders/queue/position (get user's position)
   → Display: "Your Position: 3 of 5"

4. System polls for updates (every 5 seconds)
   → GET /api/orders/queue/all (update queue display)
   → GET /api/orders/:id (update order tracking)
   → Toast: "Order ready for pickup!" (when status = ready)

5. Customer picks up order
   → Order status updated to "completed"
   → Removed from active queue
   → Can place new order
```

---

## Debugging Tips

### Queue Numbers Not Incrementing
- Check MongoDB connection
- Verify Counter collection exists
- Check for errors in server logs

### Queue Display Not Updating
- Verify polling interval is set correctly
- Check browser network tab for failed requests
- Ensure authentication cookie is valid

### Order Not Appearing in Queue
- Verify order creation succeeded (check response)
- Check order status is 'pending', 'preparing', or 'ready'
- Queue display filter might exclude 'completed' orders

### Performance Issues
- Reduce polling frequency if too many requests
- Add indexes to MongoDB:
  ```javascript
  db.orders.createIndex({ "status": 1 })
  db.orders.createIndex({ "userId": 1, "status": 1 })
  db.orders.createIndex({ "queueNumber": 1 })
  db.orders.createIndex({ "queueNumber": 1, "status": 1 })
  ```

---

## Environment Variables

Make sure these are configured:
```
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Ensure user is logged in and auth cookie is valid |
| Order not created | Check totalPrice > 0 and items array is not empty |
| Queue position shows null | Place order first, then check position |
| Queue not updating | Check network tab, may need auth cookie |
| Wrong queue number | Ensure Counter collection is being used not (manual increment) |
