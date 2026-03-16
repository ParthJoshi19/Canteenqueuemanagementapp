# Order and Queue Management System

## Overview
This document describes the complete order placement and queue management logic implemented in the Canteen Queue Management App.

## Architecture

### Backend Order Flow

#### 1. Order Placement (`POST /api/orders`)
When a user places an order, the following happens:

**Request Body:**
```json
{
  "items": ["item_id_1", "item_id_2"],
  "totalPrice": 25.50,
  "estimatedTime": 20
}
```

**Process:**
1. Authentication is validated via middleware
2. Input validation (items array must not be empty, price and time must be positive)
3. Auto-increment queue number via `Counter` collection using `getNextQueueNumber()`
4. Order is created in MongoDB with:
   - User ID (from authenticated request)
   - Queue Number (auto-generated)
   - Items array
   - Total price and estimated time
   - Status: "pending" (initial state)
   - Creation timestamp

**Response:**
```json
{
  "_id": "order_id",
  "userId": "user_id",
  "queueNumber": 42,
  "items": ["item_1", "item_2"],
  "status": "pending",
  "totalPrice": 25.50,
  "estimatedTime": 20,
  "createdAt": "2026-03-16T10:30:00Z"
}
```

#### 2. Queue Number Generation
- Uses a Counter collection with auto-increment
- `getNextQueueNumber()` function atomically increments and returns queue number
- Guarantees unique, sequential queue numbers

#### 3. Order Status Workflow
Orders progress through these statuses:
1. **pending** → Order received, placed in queue
2. **preparing** → Kitchen is actively preparing the order
3. **ready** → Order is ready for pickup
4. **completed** → Order has been picked up

Status updates are done via: `PATCH /api/orders/:id/status`

### Backend Queue Display Endpoints

#### 1. Queue Info Endpoint (`GET /api/orders/queue/info`)
Returns overall queue statistics:
```json
{
  "currentQueue": 5,
  "averageWaitTime": 18
}
```

**Logic:**
- Counts active orders (pending + preparing)
- Calculates average estimated time from active orders

#### 2. All Queue Orders (`GET /api/orders/queue/all`)
Returns all active orders sorted by queue number:
```json
[
  {
    "_id": "order_id",
    "queueNumber": 40,
    "status": "preparing",
    "estimatedTime": 20,
    "createdAt": "2026-03-16T10:15:00Z",
    "items": ["item_1", "item_2"],
    "totalPrice": 25.50
  }
]
```

**Filters:**
- Only includes orders with status: pending, preparing, ready
- Sorted by queue number (ascending)

#### 3. User Queue Position (`GET /api/orders/queue/position`)
Returns user's position in queue:
```json
{
  "queueNumber": 42,
  "position": 3,
  "totalInQueue": 5,
  "status": "preparing",
  "estimatedTime": 20
}
```

**Calculations:**
- Finds user's active order
- Counts orders with lower queue numbers
- Position = ordersAhead + 1

---

## Frontend Order & Queue Management

### 1. Cart Component (`cart.tsx`)
Enhanced with order placement functionality:

**Features:**
- Item visualization with remove options
- Real-time total and estimated time calculation
- Order placement with loading state
- Order confirmation overlay showing:
  - Queue number (formatted as 3-digit)
  - Order total
  - Estimated ready time
  - Helpful tip about tracking

**Order Placement Flow:**
1. User clicks "Place Order" button
2. Cart validates items exist
3. Sends POST request to `/api/orders` with:
   - Item IDs
   - Total price
   - Estimated time
4. On success:
   - Shows confirmation modal with queue number
   - Clears cart
   - Calls parent callback to refresh queue data
   - Shows toast notification
5. On error:
   - Shows error toast
   - Keeps cart intact

### 2. Queue Display Component (`queue-display.tsx`)
Live queue visualization with auto-refresh:

**Features:**
- **User's Position Card**: Shows queue number, position, status
- **Queue Statistics**: Active orders count, average wait time
- **Live Queue Display**: Scrollable list of all active orders
- **Status Badges**: Visual indicators (pending=yellow, preparing=blue, ready=green)
- **Auto-refresh**: Polls server every 5 seconds (configurable)
- **Error Handling**: Graceful error display

**Data Fetched:**
- All active orders (from `/queue/all`)
- User's queue position (from `/queue/position`)

**Display Logic:**
- Highlights user's own order
- Shows top 15 orders + "more orders" indicator
- Formats queue numbers with leading zeros (001, 042, etc.)
- Shows remaining wait time for each order

### 3. App Component Integration
Updated main App to:
- Import QueueDisplay component
- Add queue display toggle state
- Show "View Queue" button in menu view
- Allow switching between menu and queue display views
- Pass queue info to header for quick reference
- Auto-refresh active order after placement

---

## Data Model

### Order Schema
```typescript
interface IOrder {
  userId: ObjectId;           // User who placed order
  queueNumber: number;        // Unique queue identifier
  items: string[];            // Array of menu item IDs
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  totalPrice: number;         // Order total in currency
  estimatedTime: number;      // Minutes until ready
  createdAt: Date;           // Timestamp of order creation
}
```

### Counter Schema
```typescript
interface ICounter {
  name: string;              // Unique counter name (e.g., 'queueNumber')
  seq: number;              // Current sequence value
}
```

---

## User Experience Flow

### Customer Journey
1. **Browse Menu** → Select items and add to cart
2. **Review Cart** → See total, estimated time, item breakdown
3. **Place Order** → Submit order through cart UI
4. **Receive Queue Number** → See confirmation modal with queue #
5. **View Queue** → Click "View Queue" button to see:
   - Their position
   - Total queue length
   - Average wait time
   - Live queue display
6. **Track Order** → Order tracking modal shows status updates in real-time
7. **Receive Notification** → Toast alert when order is ready for pickup

### Queue Display Features
- **Real-time Updates**: Queue refreshes every 4-5 seconds
- **Highlights Current User's Order**: Easy to identify own order
- **Shows Status Progression**: Visual indicators for each order status
- **Position Indicator**: Know exactly how many ahead you are
- **Average Wait Time**: Helps users plan pickup time

---

## Backend Routes Summary

| Method | Route | Description | Returns |
|--------|-------|-------------|---------|
| POST | `/api/orders` | Place new order | Order object with queue number |
| GET | `/api/orders` | List user's orders | Array of user's orders |
| GET | `/api/orders/:id` | Get specific order | Order object |
| GET | `/api/orders/queue/info` | Queue statistics | {currentQueue, averageWaitTime} |
| GET | `/api/orders/queue/all` | All active orders | Array of orders in queue |
| GET | `/api/orders/queue/position` | User's queue position | {queueNumber, position, ...} |
| PATCH | `/api/orders/:id/status` | Update order status | Updated order object |

---

## Key Implementation Details

### Auto-Increment Queue Numbers
Uses MongoDB's atomic `findOneAndUpdate` with `$inc` operator to guarantee unique, sequential numbers without race conditions.

### Polling Strategy
- Cart places order immediately
- QueueDisplay polls `/queue/all` and `/queue/position` every 5 seconds
- OrderTracking polls `/orders/:id` every 2 seconds for active orders
- This approach reduces server load while maintaining real-time feel

### Status Update Flow
1. Admin/Kitchen staff updates order status via admin dashboard
2. Status is updated in database
3. UserOrders poll endpoint and see updated status
4. Toast notification triggers when status changes to "ready"

### Queue Number Formatting
- Always 3 digits with leading zeros: 001, 042, 099
- Makes queue numbers visible and easy to call out
- Used in: confirmation modal, queue display, order tracking, notifications

---

## Error Handling

### Order Placement Errors
- Empty cart → "Cart is empty"
- Network error → "Network error. Please try again."
- Server error → Backend returns specific error message

### Queue Display Errors
- Failed to fetch → "Failed to fetch queue information"
- Gracefully shows error in UI without crashing

---

## Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time updates
2. **SMS/Email Notifications**: Notify customers when order is ready
3. **Estimated Time Updates**: Adjust ETA based on queue position
4. **Queue Position History**: Show trend of position changes
5. **Admin Queue Management**: Skip/prioritize orders
6. **Queue Analytics**: Show queue patterns, peak times
7. **Mobile App**: Native app for better mobile experience
