export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'razorpay_upi' | 'razorpay_card' | 'razorpay_netbanking' | 'razorpay' | 'cash' | 'stripe_card' | 'stripe_upi';
export interface IOrder {
    _id: string;
    id: string;
    userId: string;
    queueNumber: number;
    items: string[];
    status: OrderStatus;
    totalPrice: number;
    estimatedTime: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    paymentIntentId?: string | null;
    createdAt: Date;
}
export interface IOrderWithUser extends Omit<IOrder, 'userId'> {
    userId: {
        _id: string;
        username: string;
        displayName: string;
    };
}
export declare function createOrder(input: {
    userId: string;
    queueNumber: number;
    items: string[];
    totalPrice: number;
    estimatedTime: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    paymentIntentId?: string | null;
}): Promise<IOrder>;
export declare function findOrdersByUser(userId: string): Promise<IOrder[]>;
export declare function findOrderByIdForUser(orderId: string, userId: string): Promise<IOrder | null>;
export declare function countActiveOrders(): Promise<number>;
export declare function averageActiveOrderTime(): Promise<number>;
export declare function findAllQueueOrders(): Promise<Array<Pick<IOrder, '_id' | 'queueNumber' | 'status' | 'estimatedTime' | 'createdAt' | 'totalPrice' | 'paymentStatus' | 'paymentMethod'>>>;
export declare function findUserActiveOrder(userId: string): Promise<IOrder | null>;
export declare function countOrdersAhead(queueNumber: number): Promise<number>;
export declare function countOrdersInQueue(): Promise<number>;
export declare function updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null>;
export declare function findAllOrdersWithUser(): Promise<IOrderWithUser[]>;
export declare function updateOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus, paymentMethod?: PaymentMethod): Promise<IOrder | null>;
export declare function updateOrderStatusWithUser(orderId: string, status: OrderStatus): Promise<IOrderWithUser | null>;
//# sourceMappingURL=Order.d.ts.map