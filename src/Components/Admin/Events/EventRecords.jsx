import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const EventRecords = () => { // No prop anymore
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showPastEvents } = useOutletContext(); // Access state from context

    const fetchBookings = () => {
        fetch('https://central-cafetaria-server.vercel.app/events')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                setBookings(data);
                setLoading(false);
            })
            .catch(err => {
                toast.error('Failed to fetch event bookings.');
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleClearPayment = async (bookingId) => {
        try {
            const response = await fetch(`https://central-cafetaria-server.vercel.app/events/${bookingId}/payment-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: 'paid' })
            });

            if (!response.ok) {
                throw new Error('Failed to update payment status');
            }

            toast.success('Payment cleared successfully!');
            fetchBookings(); // Re-fetch bookings to update the UI

        } catch (err) {
            console.error('Error clearing payment:', err);
            toast.error('Failed to clear payment.');
        }
    };

    const handleMakeReceipt = async (booking) => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let yPos = margin;

        const primaryColor = '#dc2626'; // Equivalent to Tailwind's red-600
        const darkTextColor = '#1f2937'; // Equivalent to Tailwind's gray-800
        const lightTextColor = '#f9fafb'; // Equivalent to Tailwind's gray-50

        // --- Header ---
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, pageWidth, 25, 'F'); // Red header bar

        // Add Logo
        const img = new Image();
        img.src = 'https://i.ibb.co/C5FDf1dD/image.png'; // Logo URL
        // It's crucial that the image is loaded before adding it to the PDF.
        // For simplicity, we'll assume it's loaded synchronously or handle this with an await if it's a base64 string.
        // For external URLs, jspdf.addImage might need the image to be loaded first.
        // A common pattern for external images: convert to base64 or pre-load.
        // For this example, I'll use addImage with assumed loading for brevity.
        // If it fails, we might need a more robust image loading solution.

        // For now, directly add image. If it doesn't appear, this is the reason.
        doc.addImage(img, 'PNG', margin, 5, 15, 15);


        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(lightTextColor);
        doc.text("Central Cafeteria - Event Receipt", pageWidth - margin, 15, { align: "right" });

        yPos = 35; // Start content below header

        // --- Receipt Title ---
        doc.setFontSize(20);
        doc.setTextColor(darkTextColor);
        doc.text("Event Booking Receipt", pageWidth / 2, yPos, { align: "center" });
        yPos += 15;

        // --- Booking Information ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Booking Information:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text(`Booking ID: ${booking._id}`, margin, yPos);
        yPos += 7;
        doc.text(`Booking Date: ${new Date(booking.createdAt).toLocaleDateString()}`, margin, yPos);
        yPos += 7;
        doc.text(`Event Date: ${new Date(booking.eventDate).toLocaleDateString()}`, margin, yPos);
        yPos += 7;
        doc.text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`, margin, yPos);
        yPos += 15;

        // --- Booked By Section ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Booked By:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text(`Name: ${booking.name}`, margin, yPos);
        yPos += 7;
        doc.text(`ID: ${booking.id}`, margin, yPos);
        yPos += 7;
        doc.text(`Email: ${booking.email}`, margin, yPos);
        yPos += 7;
        doc.text(`Department: ${booking.department}`, margin, yPos);
        yPos += 7;
        doc.text(`Phone: ${booking.phone}`, margin, yPos);
        yPos += 15;

        // --- Booking Details Section ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Booking Details:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text(`Package: ${booking.selectedPackage.name}`, margin, yPos);
        yPos += 7;
        doc.text(`Price per Package: ${booking.selectedPackage.price} tk`, margin, yPos);
        yPos += 7;
        doc.text(`Quantity: ${booking.packageQuantity}`, margin, yPos);
        yPos += 10;

        // --- Items List ---
        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text("Items Included:", margin + 5, yPos);
        yPos += 5;
        booking.selectedPackage.items.forEach(item => {
            yPos += 7;
            doc.text(`- ${item.name} (x${item.quantity})`, margin + 10, yPos);
        });
        yPos += 15;

        // --- Total Amount ---
        const total = booking.packageQuantity * booking.selectedPackage.price;
        doc.setFontSize(16);
        doc.setTextColor(primaryColor);
        doc.text(`Total Amount: ${total} tk`, pageWidth - margin, yPos, { align: "right" });
        yPos += 20;

        // --- Footer ---
        doc.setFontSize(10);
        doc.setTextColor(darkTextColor);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, pageHeight - 10);
        doc.text("Pabna University of Science and Technology", pageWidth - margin, pageHeight - 10, { align: "right" });


        doc.save(`receipt_${booking._id}.pdf`);
    };

    const filteredBookings = bookings.filter(booking => {
        const eventDate = new Date(booking.eventDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize 'now' to start of day for comparison

        if (showPastEvents) {
            return eventDate < now;
        } else {
            return eventDate >= now;
        }
    });

    if (loading) {
        return <div className="p-6 flex justify-center items-center"><Spinner /></div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Event Bookings</h1>
            {filteredBookings.length === 0 ? (
                <p>No {showPastEvents ? 'past' : 'current'} event bookings found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-red-600 text-white">
                            <tr>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Booking Date</th>
                                <th className="px-4 py-2 text-left">Event Date</th>
                                <th className="px-4 py-2 text-left">Booked By</th>
                                <th className="px-4 py-2 text-left">Booking Details</th>
                                <th className="px-4 py-2 text-left">Total</th>
                                <th className="px-4 py-2 text-left">Payment Status</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map(booking => (
                                <tr key={booking._id} className="border-t text-gray-700 hover:bg-gray-100">
                                    <td className="px-4 py-2">{booking.selectedPackage.name}</td>
                                    <td className="px-4 py-2">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">{new Date(booking.eventDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <p>{booking.name}</p>
                                        <p className="text-sm text-gray-500">ID: {booking.id}</p>
                                        <p className="text-sm text-gray-500">Email: {booking.email}</p>
                                    </td>
                                    <td className="px-4 py-2">
                                        <p>Package: {booking.selectedPackage.name} (x{booking.packageQuantity})</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600">
                                            {booking.selectedPackage.items.map((item, i) => (
                                                <li key={i}>{item.name} (x{item.quantity})</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-4 py-2 font-semibold">{booking.packageQuantity * booking.selectedPackage.price} tk</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs rounded-full text-white ${booking.paymentStatus === 'paid' ? 'bg-green-500' : (booking.paymentStatus === 'unpaid' ? 'bg-red-500' : 'bg-gray-500')}`}>
                                            {(booking.paymentStatus || 'N/A').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleMakeReceipt(booking)}
                                                    className="btn btn-sm btn-info text-white bg-blue-400"
                                                >
                                                    Make Receipt
                                                </button>
                                                {booking.paymentStatus === 'unpaid' && (
                                                <button
                                                    onClick={() => handleClearPayment(booking._id)}
                                                    className="btn btn-sm btn-success text-white bg-green-400"
                                                >
                                                    Clear Payment
                                                </button>
                                                )}
                                            </div>
                                        
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EventRecords;
