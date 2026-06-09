import React, { useEffect, useState } from 'react';
import { useAuth } from '../Authentication/AuthProvider';
import { toast } from 'react-toastify';
import Spinner from '../Shared/Spinner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Queue = () => {
    const MINUTES_PER_ORDER = 2;
    const [queueData, setQueueData] = useState([]);
    const [originalQueue, setOriginalQueue] = useState([]);
    const [view, setView] = useState('original');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const { user } = useAuth();

    const normalizeStatus = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'pending' || normalized === 'placed') return 'Placed';
        if (normalized === 'ready' || normalized === 'ready to pick') return 'Ready';
        if (normalized === 'served' || normalized === 'completed') return 'Completed';
        if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'called') return 'Cancelled';
        return status || 'Placed';
    };

    const isActiveStatus = (status) => status === 'Placed' || status === 'Ready';

    const buildFallbackToken = (order) => {
        if (order?.token) return order.token;
        if (order?.queueId) return `Q-${order.queueId}`;
        const idTail = String(order?._id || '').slice(-6);
        return idTail ? `TK-${idTail}` : 'N/A';
    };

    const resolveEstimatedWaiting = (order, queuePosition, normalizedStatus) => {
        if (normalizedStatus === 'Completed') return 0;

        const apiValue = Number(order?.estimated_waiting_minutes);
        if (Number.isFinite(apiValue) && apiValue >= 0) {
            return apiValue;
        }

        return Math.max((Number(queuePosition) || 1), 0) * MINUTES_PER_ORDER;
    };

    const normalizeOrder = (order, index = 0) => {
        const status = normalizeStatus(order?.status);
        const queuePosition = Number(order?.queue_position) > 0 ? Number(order.queue_position) : index + 1;

        return {
            ...order,
            token: buildFallbackToken(order),
            status,
            queue_position: queuePosition,
            estimated_waiting_minutes: resolveEstimatedWaiting(order, queuePosition, status),
            orderDetails: Array.isArray(order?.orderDetails) ? order.orderDetails : (Array.isArray(order?.items) ? order.items : []),
            isCurrentUser: String(order?.userId) === String(user?.id),
        };
    };

    const getOrderId = (orderOrId) => {
        if (!orderOrId) return '';

        if (typeof orderOrId === 'string') return orderOrId;
        if (typeof orderOrId === 'object') {
            if (orderOrId.$oid) return String(orderOrId.$oid);
            if (orderOrId._id) return getOrderId(orderOrId._id);
            if (typeof orderOrId.toString === 'function') {
                const value = orderOrId.toString();
                if (value && value !== '[object Object]') return value;
            }
        }

        return String(orderOrId);
    };

    useEffect(() => {
        fetchQueue();
    }, [user?.id]);

    useEffect(() => {
        const stream = new EventSource(`${API_BASE_URL}/queue/stream`);

        const onQueueUpdate = (event) => {
            try {
                const payload = JSON.parse(event.data || '{}');
                const activeQueue = (payload.activeQueue || [])
                    .sort((a, b) => {
                        const aPos = Number(a?.queue_position) || Number.MAX_SAFE_INTEGER;
                        const bPos = Number(b?.queue_position) || Number.MAX_SAFE_INTEGER;
                        return aPos - bPos;
                    })
                    .map((order, index) => normalizeOrder(order, index))
                    .filter((order) => isActiveStatus(order.status));

                setOriginalQueue(activeQueue);

                if (view === 'myOrdersTop') {
                    const sortedData = [...activeQueue].sort((a, b) => {
                        const aIsUser = String(a.userId) === String(user?.id);
                        const bIsUser = String(b.userId) === String(user?.id);
                        if (aIsUser && !bIsUser) return -1;
                        if (!aIsUser && bIsUser) return 1;
                        return a.queue_position - b.queue_position;
                    });
                    setQueueData(sortedData);
                } else {
                    setQueueData(activeQueue);
                }

                setLoading(false);
            } catch (error) {
                console.error('Queue stream parse error:', error);
            }
        };

        stream.addEventListener('queue_update', onQueueUpdate);
        stream.onerror = () => {
            // EventSource reconnects automatically; keep it alive.
            console.warn('Queue stream disconnected, retrying...');
        };

        return () => {
            stream.removeEventListener('queue_update', onQueueUpdate);
            stream.close();
        };
    }, [user?.id, view]);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/latqueue`);
            const data = await res.json();
            if (res.ok) {
                const dataWithSerial = (data.data || [])
                    .sort((a, b) => {
                        const aPos = Number(a?.queue_position) || Number.MAX_SAFE_INTEGER;
                        const bPos = Number(b?.queue_position) || Number.MAX_SAFE_INTEGER;
                        return aPos - bPos;
                    })
                    .map((order, index) => normalizeOrder(order, index))
                    .filter((order) => isActiveStatus(order.status));
                setOriginalQueue(dataWithSerial);
                setQueueData(dataWithSerial);
                setView('original');
            } else {
                toast.error(data.message || 'Failed to fetch queue.');
            }
        } catch (err) {
            console.error('Queue fetch error:', err);
            toast.error('Failed to fetch queue.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewChange = (newView) => {
        setView(newView);
        if (newView === 'myOrdersTop') {
            const sortedData = [...originalQueue].sort((a, b) => {
                const aIsUser = String(a.userId) === String(user?.id);
                const bIsUser = String(b.userId) === String(user?.id);
                if (aIsUser && !bIsUser) {
                    return -1;
                }
                if (!aIsUser && bIsUser) {
                    return 1;
                }
                return (Number(a.queue_position) || Number.MAX_SAFE_INTEGER) - (Number(b.queue_position) || Number.MAX_SAFE_INTEGER);
            });
            setQueueData(sortedData);
        } else {
            setQueueData(originalQueue);
        }
    };

    const handleMarkAsReceived = async () => {
        if (!selectedOrder?._id || !user?.id) return;

        try {
            setUpdatingStatus(true);
            const orderId = getOrderId(selectedOrder._id);
            const res = await fetch(`${API_BASE_URL}/order/${orderId}/received`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Failed to mark order as received.');
                return;
            }

            toast.success('Order marked as received.');
            setSelectedOrder(null);
            fetchQueue();
        } catch (error) {
            console.error('Mark as received error:', error);
            toast.error('Failed to mark order as received.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'Ready') return 'bg-yellow-100 text-yellow-700';
        if (status === 'Completed') return 'bg-green-100 text-green-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Current Queue</h2>

            <div className="flex justify-center items-center gap-4 mb-6">
                <button
                    className={`btn btn-sm border-2 border-red-800 font-bold ${view === 'original' ? 'bg-red-600 text-white' : 'bg-none text-red-800'}`}
                    onClick={() => handleViewChange('original')}
                >
                    Original Queue
                </button>
                <button
                    className={`btn btn-sm border-2 border-red-800 font-bold ${view === 'myOrdersTop' ? 'bg-red-600 text-white' : 'bg-none text-red-800'}`}
                    onClick={() => handleViewChange('myOrdersTop')}
                >
                    My Orders Top
                </button>
            </div>

            {loading ? (
                <Spinner />
            ) : queueData.length === 0 ? (
                <p className="text-center">No orders in queue.</p>
            ) : (
                <div className="space-y-4">
                    {queueData.map((order) => {
                        const isCurrentUser = String(order?.userId) === String(user?.id);
                        return (
                            <div
                                key={order._id}
                                className={`relative bg-white shadow-md border p-4 rounded cursor-pointer hover:shadow-lg transition ${isCurrentUser ? 'border-green-500 ring-2 ring-green-300' : ''
                                    }`}
                                onClick={() => setSelectedOrder(order)}
                            >
                                <p className="text-lg font-bold text-red-600">Token: {order.token}</p>
                                <p className="text-sm text-gray-600">Queue Position: #{order.queue_position}</p>
                                <p className="text-sm text-gray-600">Estimated Wait: {order.estimated_waiting_minutes || 0} min</p>

                                {isCurrentUser && (
                                    <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                        Your Order
                                    </span>
                                )}
                                <span className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeClass(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {selectedOrder && (String(selectedOrder.userId) === String(user?.id)) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-2 right-3 text-2xl text-gray-600 hover:text-red-500"
                            onClick={() => setSelectedOrder(null)}
                        >
                            ×
                        </button>
                        <h3 className="text-xl font-semibold mb-1 text-red-600">Token: {selectedOrder.token}</h3>
                        <p className="text-sm text-gray-500 mb-1">Queue Position: #{selectedOrder.queue_position || '-'}</p>
                        <p className="text-sm text-gray-500 mb-3">Status: {selectedOrder.status}</p>

                        <ul className="space-y-3 max-h-60 overflow-y-auto">
                            {selectedOrder.orderDetails.map((item, i) => (
                                <li key={i} className="border-b pb-2">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div>
                                            <h4 className="font-semibold">{item.name}</h4>
                                            <p className="text-sm text-gray-600">Unit: {item.unit}</p>
                                            <p className="text-sm font-bold text-red-600">{item.price} tk</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 text-right font-semibold">
                            Total:{" "}
                            {!selectedOrder.privilegeUsed ? (
                                selectedOrder.paidWithCoins ? (
                                    <span className="text-green-600">Paid with Coins</span>
                                ) : (
                                    <span className="text-red-600">
                                        {selectedOrder.orderDetails.reduce(
                                            (acc, item) => acc + Number(item.price) * item.unit,
                                            0
                                        )}{" "}
                                        tk
                                    </span>
                                )
                            ) : (
                                <span className="text-red-600">Payment Done</span>
                            )}
                        </div>

                        {selectedOrder.status === 'Ready' && (
                            <button
                                onClick={handleMarkAsReceived}
                                disabled={updatingStatus}
                                className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold disabled:opacity-60"
                            >
                                {updatingStatus ? 'Updating...' : 'Mark as Received'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Queue;

