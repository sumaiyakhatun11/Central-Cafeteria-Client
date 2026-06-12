import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';
import Button from '../../Shared/Button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://central-cafetaria-server-tau.vercel.app';

const Queue = () => {
    const [activeOrders, setActiveOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingControl, setUpdatingControl] = useState(false);
    const [tokenQuery, setTokenQuery] = useState('');
    const [searchedOrder, setSearchedOrder] = useState(null);
    const [queueControl, setQueueControl] = useState({
        minutesPerOrder: 2,
        queueEnabled: true
    });
    const [stats, setStats] = useState({
        totalOrdersToday: 0,
        pendingOrders: 0,
        readyOrders: 0,
        completedOrders: 0
    });

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

        return Math.max((Number(queuePosition) || 1), 0) * (queueControl.minutesPerOrder || 2);
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

    const fetchQueueData = async () => {
        try {
            setLoading(true);
            const parseJsonSafe = async (response) => {
                try {
                    return await response.json();
                } catch (_) {
                    return {};
                }
            };

            const activeRes = await fetch(`${API_BASE_URL}/latqueue`);
            const activeData = await parseJsonSafe(activeRes);

            const queueControlRes = await fetch(`${API_BASE_URL}/queue-control`);
            const queueControlData = await parseJsonSafe(queueControlRes);

            if (queueControlRes.ok) {
                setQueueControl({
                    minutesPerOrder: Number(queueControlData.minutesPerOrder) || 2,
                    queueEnabled: queueControlData.queueEnabled !== false
                });
            }

            if (!activeRes.ok) {
                toast.error(activeData.message || 'Failed to load active queue.');
            } else {
                setActiveOrders(
                    (activeData.data || [])
                        .sort((a, b) => {
                            const aPos = Number(a?.queue_position) || Number.MAX_SAFE_INTEGER;
                            const bPos = Number(b?.queue_position) || Number.MAX_SAFE_INTEGER;
                            return aPos - bPos;
                        })
                        .map((order, index) => normalizeOrder(order, index))
                        .filter((order) => isActiveStatus(order.status))
                );
            }

            const [completedResult, statsResult] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/queue/completed`),
                fetch(`${API_BASE_URL}/queue/stats`)
            ]);

            if (completedResult.status === 'fulfilled') {
                const completedRes = completedResult.value;
                const completedData = await parseJsonSafe(completedRes);
                if (completedRes.ok) {
                    setCompletedOrders((completedData.data || []).map((order, index) => normalizeOrder(order, index)));
                }
            }

            if (statsResult.status === 'fulfilled') {
                const statsRes = statsResult.value;
                const statsData = await parseJsonSafe(statsRes);
                if (statsRes.ok) {
                    setStats({
                        totalOrdersToday: statsData.totalOrdersToday || 0,
                        pendingOrders: statsData.pendingOrders || 0,
                        readyOrders: statsData.readyOrders || 0,
                        completedOrders: statsData.completedOrders || 0
                    });
                }
            }
        } catch (err) {
            console.error('Queue fetch error:', err);
            toast.error('Failed to fetch queue data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueData();
    }, []);

    useEffect(() => {
        const stream = new EventSource(`${API_BASE_URL}/queue/stream`);

        const onQueueUpdate = (event) => {
            try {
                const payload = JSON.parse(event.data || '{}');

                setActiveOrders(
                    (payload.activeQueue || [])
                        .sort((a, b) => {
                            const aPos = Number(a?.queue_position) || Number.MAX_SAFE_INTEGER;
                            const bPos = Number(b?.queue_position) || Number.MAX_SAFE_INTEGER;
                            return aPos - bPos;
                        })
                        .map((order, index) => normalizeOrder(order, index))
                        .filter((order) => isActiveStatus(order.status))
                );
                setCompletedOrders((payload.completedOrders || []).map((order, index) => normalizeOrder(order, index)));
                if (payload.stats) {
                    setStats({
                        totalOrdersToday: payload.stats.totalOrdersToday || 0,
                        pendingOrders: payload.stats.pendingOrders || 0,
                        readyOrders: payload.stats.readyOrders || 0,
                        completedOrders: payload.stats.completedOrders || 0
                    });
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
    }, []);

    const recalculateActiveQueue = (orders) => {
        return orders
            .map((order, index) => {
                const queuePosition = index + 1;
                return normalizeOrder({
                    ...order,
                    queue_position: queuePosition,
                    estimated_waiting_minutes: queuePosition * (queueControl.minutesPerOrder || 2)
                }, index);
            });
    };

    const updateQueueControl = async (payload) => {
        try {
            setUpdatingControl(true);
            const res = await fetch(`${API_BASE_URL}/queue-control`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Failed to update queue control.');
                return;
            }

            toast.success('Queue control updated.');
            const nextControl = {
                minutesPerOrder: Number(data.control?.minutesPerOrder) || 2,
                queueEnabled: data.control?.queueEnabled !== false
            };
            setQueueControl(nextControl);
            setActiveOrders((prev) => prev.map((order, index) => {
                const queuePosition = Number(order?.queue_position) > 0 ? Number(order.queue_position) : index + 1;
                return normalizeOrder({
                    ...order,
                    estimated_waiting_minutes: queuePosition * nextControl.minutesPerOrder
                }, index);
            }));
        } catch (error) {
            console.error('Queue control update error:', error);
            toast.error('Failed to update queue control.');
        } finally {
            setUpdatingControl(false);
        }
    };

    const applyLocalStatusTransition = (orderId, status) => {
        const normalizedNextStatus = normalizeStatus(status);
        let movedOrder = null;
        const normalizedOrderId = getOrderId(orderId);
        let currentOrderStatus = 'Placed';

        setActiveOrders((prev) => {
            const target = prev.find((order) => getOrderId(order._id) === normalizedOrderId);
            if (!target) {
                return prev;
            }

            currentOrderStatus = normalizeStatus(target.status);
            const remaining = prev.filter((order) => getOrderId(order._id) !== normalizedOrderId);

            if (normalizedNextStatus === 'Completed') {
                movedOrder = normalizeOrder({
                    ...target,
                    status: 'Completed',
                    completed_at: new Date().toISOString(),
                    queue_position: null,
                    estimated_waiting_minutes: 0
                });
                return recalculateActiveQueue(remaining);
            }

            if (normalizedNextStatus === 'Cancelled') {
                return recalculateActiveQueue(remaining);
            }

            return prev;
        });

        if (normalizedNextStatus === 'Completed' && movedOrder) {
            setCompletedOrders((prev) => [movedOrder, ...prev]);
        }

        setStats((prev) => {
            if (normalizedNextStatus === 'Completed') {
                return {
                    ...prev,
                    pendingOrders: Math.max((prev.pendingOrders || 0) - (currentOrderStatus === 'Placed' ? 1 : 0), 0),
                    readyOrders: Math.max((prev.readyOrders || 0) - (currentOrderStatus === 'Ready' ? 1 : 0), 0),
                    completedOrders: (prev.completedOrders || 0) + 1
                };
            }

            if (normalizedNextStatus === 'Cancelled') {
                return {
                    ...prev,
                    pendingOrders: Math.max((prev.pendingOrders || 0) - (currentOrderStatus === 'Placed' ? 1 : 0), 0),
                    readyOrders: Math.max((prev.readyOrders || 0) - (currentOrderStatus === 'Ready' ? 1 : 0), 0)
                };
            }

            return prev;
        });
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            setUpdatingStatus(true);
            const normalizedOrderId = getOrderId(orderId);
            const res = await fetch(`${API_BASE_URL}/order/${normalizedOrderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();

            if (!res.ok) {
                if (String(data.message || '').toLowerCase().includes('invalid status value')) {
                    toast.error('Backend is running old queue API. Deploy updated server to use Placed/Ready/Completed flow.');
                    return;
                }
                toast.error(data.message || 'Failed to update order status.');
                return;
            }

            toast.success(data.message || `Order marked as ${status}`);
            applyLocalStatusTransition(normalizedOrderId, status);
            setSelectedOrder(null);
            // Keep server as source of truth and reconcile shortly after optimistic UI update.
            setTimeout(() => {
                fetchQueueData();
            }, 400);
        } catch (err) {
            console.error('Status update error:', err);
            toast.error('Failed to update status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleSearchByToken = async () => {
        if (!tokenQuery.trim()) {
            setSearchedOrder(null);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/queue/token/${encodeURIComponent(tokenQuery.trim())}`);
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Token not found.');
                setSearchedOrder(null);
                return;
            }

            setSearchedOrder(data.data);
        } catch (error) {
            console.error('Token search error:', error);
            toast.error('Failed to search by token.');
        }
    };

    const statsCards = useMemo(() => ([
        { label: 'Total Orders Today', value: stats.totalOrdersToday, className: 'bg-blue-50 text-blue-700' },
        { label: 'Pending Orders', value: stats.pendingOrders, className: 'bg-orange-50 text-orange-700' },
        { label: 'Ready Orders', value: stats.readyOrders, className: 'bg-yellow-50 text-yellow-700' },
        { label: 'Completed Orders', value: stats.completedOrders, className: 'bg-green-50 text-green-700' }
    ]), [stats]);

    return (
        <div className="p-6 max-w-7xl mx-auto text-black">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-bold">Order Queue & Token Management</h2>
                <Button variant="outline" onClick={fetchQueueData} isLoading={loading}>
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statsCards.map((card) => (
                    <div key={card.label} className={`rounded-lg p-4 border ${card.className}`}>
                        <p className="text-sm font-semibold">{card.label}</p>
                        <p className="text-3xl font-bold mt-2">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border rounded-lg p-4 mb-8">
                <h3 className="text-xl font-semibold mb-3">Queue Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2">Minutes Per Order</label>
                        <input
                            type="number"
                            min="1"
                            value={queueControl.minutesPerOrder}
                            onChange={(e) => setQueueControl((prev) => ({
                                ...prev,
                                minutesPerOrder: Math.max(Number(e.target.value) || 1, 1)
                            }))}
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Queue Status</label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={queueControl.queueEnabled}
                                onChange={(e) => setQueueControl((prev) => ({
                                    ...prev,
                                    queueEnabled: e.target.checked
                                }))}
                            />
                            <span>{queueControl.queueEnabled ? 'Enabled' : 'Disabled'}</span>
                        </label>
                    </div>

                    <Button
                        variant="primary"
                        isLoading={updatingControl}
                        onClick={() => updateQueueControl({
                            minutesPerOrder: queueControl.minutesPerOrder,
                            queueEnabled: queueControl.queueEnabled
                        })}
                    >
                        Save Queue Control
                    </Button>
                </div>
            </div>

            <div className="bg-white border rounded-lg p-4 mb-8">
                <h3 className="text-xl font-semibold mb-3">Search By Token</h3>
                <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                        type="text"
                        value={tokenQuery}
                        onChange={(e) => setTokenQuery(e.target.value)}
                        placeholder="e.g. TK-20260421-123"
                        className="input input-bordered w-full"
                    />
                    <Button onClick={handleSearchByToken}>Search</Button>
                </div>

                {searchedOrder && (
                    <div className="mt-4 p-4 rounded border bg-gray-50">
                        <p><strong>Token:</strong> {normalizeOrder(searchedOrder).token}</p>
                        <p><strong>Status:</strong> {normalizeStatus(searchedOrder.status)}</p>
                        <p><strong>Queue Position:</strong> {normalizeOrder(searchedOrder).queue_position || '-'}</p>
                        <p><strong>Customer:</strong> {searchedOrder.customer_name || '-'}</p>
                        <p><strong>Estimated Wait:</strong> {searchedOrder.estimated_waiting_minutes || 0} min</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-semibold mb-4">Live Order Queue</h3>
                    {loading ? (
                        <Spinner />
                    ) : activeOrders.length === 0 ? (
                        <p className="text-gray-600">No active orders.</p>
                    ) : (
                        <div className="space-y-3">
                            {activeOrders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-4 border rounded-lg bg-white hover:shadow-md cursor-pointer"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div>
                                            <p className="font-bold text-red-600">Token: {order.token}</p>
                                            <p className="text-sm text-gray-600">Queue Position: #{order.queue_position}</p>
                                            <p className="text-sm text-gray-600">Customer: {order.customer_name || '-'}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'Ready' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-2xl font-semibold mb-4">Completed Orders</h3>
                    {completedOrders.length === 0 ? (
                        <p className="text-gray-600">No completed orders yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                            {completedOrders.map((order) => (
                                <div key={order._id} className="p-4 border rounded-lg bg-white">
                                    <p className="font-bold text-green-700">Token: {order.token}</p>
                                    <p className="text-sm text-gray-600">Customer: {order.customer_name || '-'}</p>
                                    <p className="text-sm text-gray-600">Completed At: {order.completed_at ? new Date(order.completed_at).toLocaleString() : '-'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-6 relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-3 text-2xl text-gray-600 hover:text-red-500 !p-0"
                            onClick={() => setSelectedOrder(null)}
                        >
                            &times;
                        </Button>

                        <h3 className="text-xl font-bold text-red-600 mb-1">Token: {selectedOrder.token}</h3>
                        <p className="text-sm text-gray-500 mb-1">Status: {selectedOrder.status}</p>
                        <p className="text-sm text-gray-500 mb-3">Queue Position: #{selectedOrder.queue_position}</p>

                        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                            <p><strong>Admin Flow:</strong> Complete or cancel the order.</p>
                            <p><strong>Completion:</strong> Customer may also mark their order complete from the customer queue.</p>
                        </div>

                        <ul className="space-y-2 max-h-60 overflow-y-auto mb-4">
                            {(selectedOrder.orderDetails || []).map((item, index) => (
                                <li key={index} className="border rounded p-2">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-600">Qty: {item.unit} | Price: {item.price} tk</p>
                                </li>
                            ))}
                        </ul>

                        <div className="flex gap-3 justify-end">
                            {(selectedOrder.status === 'Placed' || selectedOrder.status === 'Ready') && (
                                <>
                                    <Button
                                        variant="danger"
                                        isLoading={updatingStatus}
                                        onClick={() => updateOrderStatus(selectedOrder._id, 'Cancelled')}
                                    >
                                        Cancel Order
                                    </Button>
                                    <Button
                                        variant="success"
                                        isLoading={updatingStatus}
                                        onClick={() => updateOrderStatus(selectedOrder._id, 'Completed')}
                                    >
                                        Complete Order
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Queue;
