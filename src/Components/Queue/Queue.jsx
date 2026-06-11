import React, { useEffect, useState } from 'react';
import { useAuth } from '../Authentication/AuthProvider';
import { toast } from 'react-toastify';
import Spinner from '../Shared/Spinner';
import Button from '../Shared/Button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Queue = () => {
    const MINUTES_PER_ORDER = 2;
    const [queueData, setQueueData] = useState([]);
    const [originalQueue, setOriginalQueue] = useState([]);
    const [view, setView] = useState('original');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedCounter, setSelectedCounter] = useState('');

    const counterOptions = [
        { value: '1', label: 'Counter 1' },
        { value: '2', label: 'Counter 2 (Female)' }
    ];

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

    const normalizeOrder = (order, index = 0, queuePositionOverride) => {
        const status = normalizeStatus(order?.status);
        const queuePosition = Number(queuePositionOverride) > 0
            ? Number(queuePositionOverride)
            : (Number(order?.queue_position) > 0 ? Number(order.queue_position) : index + 1);

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
        if (user && (user.role === 'student' || user.role === 'staff')) {
            const storedCounter = localStorage.getItem('selectedCounter') || '';
            setSelectedCounter(storedCounter);
        }
    }, [user?.id]);

    const handleCounterSelect = (counter) => {
        setSelectedCounter(counter);
        if (user && (user.role === 'student' || user.role === 'staff')) {
            localStorage.setItem('selectedCounter', counter);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [user?.id, selectedCounter]);

    useEffect(() => {
        const stream = new EventSource(`${API_BASE_URL}/queue/stream`);

        const onQueueUpdate = (event) => {
            try {
                const payload = JSON.parse(event.data || '{}');
                const activeQueue = (payload.activeQueue || [])
                    .filter((order) => isActiveStatus(normalizeStatus(order?.status)))
                    .sort((a, b) => {
                        const aPos = Number(a?.queue_position) || Number.MAX_SAFE_INTEGER;
                        const bPos = Number(b?.queue_position) || Number.MAX_SAFE_INTEGER;
                        return aPos - bPos;
                    });

                const filteredActiveQueue = (user && (user.role === 'student' || user.role === 'staff') && selectedCounter)
                    ? activeQueue.filter((order) => String(order.counter) === String(selectedCounter))
                    : activeQueue;

                const normalizedQueue = filteredActiveQueue.map((order, index) => normalizeOrder(order, index, index + 1));

                setOriginalQueue(normalizedQueue);

                const dataToUse = view === 'myOrdersTop'
                    ? [...normalizedQueue].sort((a, b) => {
                        const aIsUser = String(a.userId) === String(user?.id);
                        const bIsUser = String(b.userId) === String(user?.id);
                        if (aIsUser && !bIsUser) return -1;
                        if (!aIsUser && bIsUser) return 1;
                        return a.queue_position - b.queue_position;
                    })
                    : normalizedQueue;

                setQueueData(dataToUse);

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
    }, [user?.id, view, selectedCounter]);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/latqueue`);
            const data = await res.json();
            if (res.ok) {
                const allActiveOrders = (data.data || [])
                    .filter((order) => isActiveStatus(normalizeStatus(order?.status)))
                    .sort((a, b) => {
                        const aPos = Number(a?.queue_position) || Number.MAX_SAFE_INTEGER;
                        const bPos = Number(b?.queue_position) || Number.MAX_SAFE_INTEGER;
                        return aPos - bPos;
                    });

                const filteredOrders = (user && (user.role === 'student' || user.role === 'staff') && selectedCounter)
                    ? allActiveOrders.filter((order) => String(order.counter) === String(selectedCounter))
                    : allActiveOrders;

                const normalizedOrders = filteredOrders.map((order, index) => normalizeOrder(order, index, index + 1));

                setOriginalQueue(normalizedOrders);
                setQueueData(normalizedOrders);
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

    const handleMarkAsComplete = async () => {
        if (!selectedOrder?._id) return;

        try {
            setUpdatingStatus(true);
            const orderId = getOrderId(selectedOrder._id);
            const res = await fetch(`${API_BASE_URL}/order/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Failed to mark order as complete.');
                return;
            }

            toast.success('Order marked as complete.');
            setSelectedOrder(null);
            fetchQueue();
        } catch (error) {
            console.error('Mark as complete error:', error);
            toast.error('Failed to mark order as complete.');
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

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
                {user && (user.role === 'student' || user.role === 'staff') && (
                    <div className="flex flex-wrap items-center gap-3 bg-white/10 rounded-xl p-3 shadow-sm">
                        <p className="text-white font-medium">Select Counter:</p>
                        {counterOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={selectedCounter === option.value ? 'solid' : 'outline'}
                                size="sm"
                                className={selectedCounter === option.value ? 'bg-red-600 text-white border-red-800' : ''}
                                onClick={() => handleCounterSelect(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                )}
                <div className="flex flex-wrap justify-center items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className={view === 'original' ? 'bg-red-600 text-white border-red-800' : ''}
                        onClick={() => handleViewChange('original')}
                    >
                        Original Queue
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className={view === 'myOrdersTop' ? 'bg-red-600 text-white border-red-800' : ''}
                        onClick={() => handleViewChange('myOrdersTop')}
                    >
                        My Orders Top
                    </Button>
                </div>
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
                                <p className="text-sm text-gray-600">Counter: {order.counter || 'N/A'}</p>
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
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-3 !p-0 text-2xl text-gray-600 hover:text-red-500"
                            onClick={() => setSelectedOrder(null)}
                        >
                            ×
                        </Button>
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

                        {(selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled') && (
                            <Button
                                variant="success"
                                fullWidth
                                isLoading={updatingStatus}
                                onClick={handleMarkAsComplete}
                            >
                                {updatingStatus ? 'Updating...' : 'Mark as Complete'}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Queue;

