import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa'; // Added FaDownload
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf'; // Import jspdf
import Spinner from './Spinner';

const EventHistoryModal = ({ isOpen, onClose, userId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function to load image and convert to Base64, returning dimensions
    const loadImageAsBase64 = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            dataUrl: reader.result,
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                        });
                    };
                    img.onerror = reject;
                    img.src = reader.result; // Set image source to data URL
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error loading image as base64:', error);
            return null;
        }
    };

    useEffect(() => {
        if (isOpen && userId) {
            const fetchUserEvents = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`https://central-cafetaria-server.vercel.app/users/${userId}/events`); // Placeholder API endpoint
                    const data = await response.json();
                    if (response.ok) {
                        setEvents(data.events);
                    } else {
                        throw new Error(data.message || 'Failed to fetch user events');
                    }
                } catch (err) {
                    console.error('Error fetching user events:', err);
                    toast.error(err.message || 'Error loading event history.');
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchUserEvents();
        }
    }, [isOpen, userId]);

    // Adapted handleMakeReceipt from Admin/EventRecords.jsx
    const handleDownloadReceipt = async (event) => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let yPos = margin;

        const primaryColor = '#dc2626'; // Equivalent to Tailwind's red-600
        const darkTextColor = '#1f2937'; // Equivalent to Tailwind's gray-800
        const lightTextColor = '#f9fafb'; // Equivalent to Tailwind's gray-50

        const paidStampUrl = 'https://i.ibb.co.com/jZVYsd7Q/image.png';
        const unpaidStampUrl = 'https://i.ibb.co.com/TMTxsz52/image.png';
        const logoUrl = 'https://i.ibb.co/C5FDf1dD/image.png';

        // Load images and their dimensions
        const [logoData, paidStampData, unpaidStampData] = await Promise.all([
            loadImageAsBase64(logoUrl),
            loadImageAsBase64(paidStampUrl),
            loadImageAsBase64(unpaidStampUrl)
        ]);

        // --- Header ---
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, pageWidth, 25, 'F'); // Red header bar

        // Add Logo
        if (logoData && logoData.dataUrl) {
            const logoFixedSize = 15; // Desired width/height for logo
            const logoAspectRatio = logoData.width / logoData.height;
            let logoWidth = logoFixedSize;
            let logoHeight = logoFixedSize;

            if (logoAspectRatio > 1) { // Wider than tall
                logoHeight = logoFixedSize / logoAspectRatio;
            } else { // Taller than wide or square
                logoWidth = logoFixedSize * logoAspectRatio;
            }
            doc.addImage(logoData.dataUrl, 'PNG', margin, 5 + (logoFixedSize - logoHeight) / 2, logoWidth, logoHeight);
        } else {
            doc.text("Logo", margin, 15); // Fallback text for logo
        }

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
        doc.text(`Booking ID: ${event._id}`, margin, yPos);
        yPos += 7;
        doc.text(`Booking Date: ${new Date(event.createdAt).toLocaleDateString()}`, margin, yPos);
        yPos += 7;
        doc.text(`Event Date: ${new Date(event.eventDate).toLocaleDateString()}`, margin, yPos);
        yPos += 7;
        doc.text(`Payment Status: ${event.paymentStatus.toUpperCase()}`, margin, yPos);
        yPos += 15;

        // --- Booked By Section ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Booked By:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text(`Name: ${event.name}`, margin, yPos);
        yPos += 7;
        doc.text(`ID: ${event.id}`, margin, yPos);
        yPos += 7;
        doc.text(`Email: ${event.email}`, margin, yPos);
        yPos += 7;
        doc.text(`Department: ${event.department}`, margin, yPos);
        yPos += 7;
        doc.text(`Phone: ${event.phone}`, margin, yPos);
        yPos += 15;

        // --- Booking Details Section ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Booking Details:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text(`Package: ${event.selectedPackage.name}`, margin, yPos);
        yPos += 7;
        doc.text(`Price per Package: ${event.selectedPackage.price} tk`, margin, yPos);
        yPos += 7;
        doc.text(`Quantity: ${event.packageQuantity}`, margin, yPos);
        yPos += 10;

        // --- Items List ---
        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text("Items Included:", margin + 5, yPos);
        yPos += 5;
        event.selectedPackage.items.forEach(item => {
            yPos += 7;
            doc.text(`- ${item.name} (x${item.quantity})`, margin + 10, yPos);
        });
        yPos += 15;

        // --- Total Amount ---
        const total = event.packageQuantity * event.selectedPackage.price;
        doc.setFontSize(16);
        doc.setTextColor(primaryColor);
        doc.text(`Total Amount: ${total} tk`, pageWidth - margin, yPos, { align: "right" });
        yPos += 20;

        // --- Add Stamp Image based on Payment Status ---
        let stampData = null;
        if (event.paymentStatus === 'paid') {
            stampData = paidStampData;
        } else if (event.paymentStatus === 'unpaid') {
            stampData = unpaidStampData;
        }

        if (stampData && stampData.dataUrl) {
            const desiredStampWidth = 40; // Max width for the stamp
            const stampAspectRatio = stampData.width / stampData.height;
            const stampWidth = desiredStampWidth;
            const stampHeight = desiredStampWidth / stampAspectRatio; // Calculate height maintaining aspect ratio

            // Position it bottom right, above the footer
            doc.addImage(stampData.dataUrl, 'PNG', pageWidth - margin - stampWidth, pageHeight - margin - stampHeight - 10, stampWidth, stampHeight);
        }


        // --- Footer ---
        doc.setFontSize(10);
        doc.setTextColor(darkTextColor);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, pageHeight - 10);
        doc.text("Pabna University of Science and Technology", pageWidth - margin, pageHeight - 10, { align: "right" });


        doc.save(`receipt_event_${event._id}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl transform transition-all duration-300">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-2xl font-bold text-red-600">Your Event History</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48"><Spinner /></div>
                ) : error ? (
                    <div className="text-center text-red-500 py-4">Error: {error}</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-4">No event bookings found.</div>
                ) : (
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-red-600 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">Event Name</th>
                                    <th className="px-4 py-2 text-left">Event Date</th>
                                    <th className="px-4 py-2 text-left">Package</th>
                                    <th className="px-4 py-2 text-left">Quantity</th>
                                    <th className="px-4 py-2 text-left">Total</th>
                                    <th className="px-4 py-2 text-left">Payment</th>
                                    <th className="px-4 py-2 text-left">Actions</th> {/* New Header */}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event._id} className="border-t text-gray-700 hover:bg-gray-100">
                                        <td className="px-4 py-2">{event.selectedPackage.name}</td>
                                        <td className="px-4 py-2">{new Date(event.eventDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{event.selectedPackage.name}</td>
                                        <td className="px-4 py-2">{event.packageQuantity}</td>
                                        <td className="px-4 py-2 font-semibold">{event.selectedPackage.price * event.packageQuantity} tk</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 text-xs rounded-full text-white ${event.paymentStatus === 'paid' ? 'bg-green-500' : (event.paymentStatus === 'unpaid' ? 'bg-red-500' : 'bg-gray-500')}`}>
                                                {(event.paymentStatus || 'N/A').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2"> {/* New TD for actions */}
                                            <button
                                                onClick={() => handleDownloadReceipt(event)}
                                                className="btn btn-sm btn-info text-white bg-blue-400 flex items-center gap-1"
                                            >
                                                <FaDownload /> Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventHistoryModal;