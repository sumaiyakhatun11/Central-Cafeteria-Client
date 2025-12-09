import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const EventBookingModal = ({ isOpen, onClose, user }) => {
    const [eventFormData, setEventFormData] = useState({});
    const [foodPackages, setFoodPackages] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchFoodPackages();
            if (user) {
                setEventFormData({
                    name: user.name || '',
                    id: user.userId || '',
                    email: user.email || '',
                    department: '',
                    phone: '',
                    eventDate: '',
                    selectedPackage: null,
                    packageQuantity: 1
                });
            }
        } else {
            setEventFormData({});
        }
    }, [isOpen, user]);

    const fetchFoodPackages = async () => {
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/food-packages');
            const data = await res.json();
            if (res.ok) {
                setFoodPackages(data);
            } else {
                throw new Error('Failed to fetch food packages');
            }
        } catch (error) {
            toast.error('Failed to fetch food packages.');
        }
    };

    const handleEventFormChange = (e) => {
        const { name, value } = e.target;
        setEventFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePackageChange = (e) => {
        const selectedPkg = foodPackages.find(p => p.name === e.target.value) || null;
        setEventFormData(prev => ({ ...prev, selectedPackage: selectedPkg }));
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://central-cafetaria-server.vercel.app/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventFormData)
            });

            if (!response.ok) {
                throw new Error('Booking submission failed');
            }

            const result = await response.json();
            toast.success(`Event booked successfully! Your Booking ID is ${result.bookingId}`);
            onClose(); // Close modal on submit

        } catch (error) {
            console.error('Event booking error:', error);
            toast.error('Failed to book event. Please try again later.');
        }
    };

    return (
        <dialog id="event_modal" className={`modal ${isOpen ? 'modal-open' : ''}`}>
            <div className="modal-box w-11/12 max-w-2xl">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                <h3 className="font-bold text-2xl mb-4">Event Booking Form</h3>
                <form onSubmit={handleEventSubmit}>
                    {/* Pre-filled Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Name</span></label>
                            <input type="text" value={eventFormData.name || ''} className="input input-bordered" disabled />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">ID</span></label>
                            <input type="text" value={eventFormData.id || ''} className="input input-bordered" disabled />
                        </div>
                        <div className="form-control md:col-span-2">
                            <label className="label"><span className="label-text">Email</span></label>
                            <input type="email" value={eventFormData.email || ''} className="input input-bordered" disabled />
                        </div>
                    </div>

                    {/* New Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Department Name</span></label>
                            <input type="text" name="department" value={eventFormData.department || ''} onChange={handleEventFormChange} className="input input-bordered" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Phone Number</span></label>
                            <input type="tel" name="phone" value={eventFormData.phone || ''} onChange={handleEventFormChange} className="input input-bordered" required />
                        </div>
                        <div className="form-control md:col-span-2">
                            <label className="label"><span className="label-text">Event Date</span></label>
                            <input type="date" name="eventDate" value={eventFormData.eventDate || ''} onChange={handleEventFormChange} className="input input-bordered" required />
                        </div>
                    </div>

                    {/* Package Selection */}
                    <div className="form-control mb-4">
                        <label className="label"><span className="label-text">Select Food Package</span></label>
                        <select name="selectedPackage" onChange={handlePackageChange} className="select select-bordered" required defaultValue="">
                            <option value="" disabled>Pick one</option>
                            {foodPackages.map(pkg => <option key={pkg._id} value={pkg.name}>{pkg.name} - {pkg.price} tk</option>)}
                        </select>
                    </div>

                    {/* Package Details & Quantity */}
                    {eventFormData.selectedPackage && (
                        <div className="border rounded-lg p-4 mb-4 bg-base-200">
                            <h4 className="font-semibold text-lg mb-2">Package Details:</h4>
                            <ul className="list-disc list-inside mb-4">
                                {eventFormData.selectedPackage.items.map(item => <li key={item.name}>{item.name} (x{item.quantity})</li>)}
                            </ul>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Number of Packages (e.g., for 50 guests, enter 50)</span></label>
                                <input type="number" name="packageQuantity" value={eventFormData.packageQuantity} onChange={handleEventFormChange} className="input input-bordered" min="1" required />
                            </div>
                        </div>
                    )}

                    <div className="modal-action mt-6">
                        <button type="submit" className="btn btn-primary">Submit Booking</button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};

export default EventBookingModal;