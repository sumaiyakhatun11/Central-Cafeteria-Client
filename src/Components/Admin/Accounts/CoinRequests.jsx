import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import CoinRequestDetailsModal from './CoinRequestDetailsModal';
import Spinner from '../../Shared/Spinner';
import SetCoinValueModal from './SetCoinValueModal';
import { useAuth } from '../../Authentication/AuthProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf'; // Import jspdf
import { FaDownload } from 'react-icons/fa'; // Import FaDownload

const CoinRequests = () => {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCoinValueModalOpen, setIsCoinValueModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [coinValue, setCoinValue] = useState(5);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

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

    const fetchCoinValue = async () => {
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/coin-value');
            const data = await res.json();
            if (res.ok) {
                setCoinValue(data.value);
                setLastUpdatedAt(data.lastUpdatedAt);
            } else {
                console.log('Could not fetch coin value, using default.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCoinRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/users');
            const data = await res.json();
            if (res.ok) {
                const allRequests = data.data.reduce((acc, user) => {
                    if (user.coinIncreaseRequests) {
                        const userRequests = user.coinIncreaseRequests.map(req => ({
                            ...req,
                            userId: user._id,
                            userName: user.name,
                            userEmail: user.email
                        }));
                        return [...acc, ...userRequests];
                    }
                    return acc;
                }, []);

                const pending = allRequests.filter(req => req.status === 'pending');
                const approved = allRequests.filter(req => req.status === 'approved');

                setPendingRequests(pending);
                setApprovedRequests(approved);
            } else {
                toast.error('Failed to fetch coin requests.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error fetching coin requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoinRequests();
        fetchCoinValue();
    }, []);

    useEffect(() => {
        let sourceData = activeTab === 'pending' ? pendingRequests : approvedRequests;

        if (searchTerm) {
            sourceData = sourceData.filter(req =>
                req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedDate) {
            sourceData = sourceData.filter(req =>
                new Date(req.requestedAt).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
            );
        }

        setFilteredRequests(sourceData);
    }, [activeTab, searchTerm, selectedDate, pendingRequests, approvedRequests]);

    const handleRequestUpdate = async (userId, requestId, status) => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${userId}/coin-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success(`Request ${status} successfully!`);
                fetchCoinRequests();
                setIsModalOpen(false);
            } else {
                toast.error(`Failed to ${status} request.`);
            }
        } catch (err) {
            console.error(err);
            toast.error(`Error updating request.`);
        }
    };

    const handleDownloadCsv = async () => {
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/users');
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to fetch data');

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const allRequests = data.data
                .reduce((acc, user) => {
                    if (user.coinIncreaseRequests) {
                        const userRequests = user.coinIncreaseRequests.map(req => ({
                            ...req,
                            userName: user.name,
                            userEmail: user.email
                        }));
                        return [...acc, ...userRequests];
                    }
                    return acc;
                }, [])
                .filter(req => new Date(req.requestedAt) >= oneYearAgo);

            // Group by month
            const monthlyData = allRequests.reduce((acc, req) => {
                const month = new Date(req.requestedAt).toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!acc[month]) {
                    acc[month] = { requests: [], total: 0, totalBdt: 0 };
                }
                acc[month].requests.push(req);
                acc[month].total += req.amount;
                acc[month].totalBdt += req.amount * coinValue;
                return acc;
            }, {});

            let csvContent = "Date,User Name,User Email,Amount,BDT Value,Status\n";

            for (const month in monthlyData) {
                monthlyData[month].requests.forEach(req => {
                    const date = new Date(req.requestedAt).toLocaleDateString();
                    const bdtValue = req.amount * coinValue;
                    csvContent += `${date},${req.userName},${req.userEmail},${req.amount},${bdtValue},${req.status}\n`;
                });
                csvContent += `\n,,Total for ${month}:,${monthlyData[month].total},${monthlyData[month].totalBdt},\n\n`;
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, "coin_requests_report.csv");

        } catch (err) {
            console.error(err);
            toast.error('Failed to generate CSV report.');
        }
    };

    const getHighlightDates = () => {
        const sourceData = activeTab === 'pending' ? pendingRequests : approvedRequests;
        return sourceData.map(req => new Date(req.requestedAt));
    };

    const handleDownloadCoinReceipt = async (request) => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let yPos = margin;

        const primaryColor = '#dc2626'; // Equivalent to Tailwind's red-600
        const darkTextColor = '#1f2937'; // Equivalent to Tailwind's gray-800
        const lightTextColor = '#f9fafb'; // Equivalent to Tailwind's gray-50

        const logoUrl = 'https://i.ibb.co/C5FDf1dD/image.png';

        // Load images and their dimensions
        const [logoData, receiptImageData] = await Promise.all([
            loadImageAsBase64(logoUrl),
            request.receiptImageUrl ? loadImageAsBase64(request.receiptImageUrl) : Promise.resolve(null)
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
        doc.text("Central Cafeteria - Coin Request Receipt", pageWidth - margin, 15, { align: "right" });

        yPos = 35; // Start content below header

        // --- Receipt Title ---
        doc.setFontSize(20);
        doc.setTextColor(darkTextColor);
        doc.text("Coin Request Receipt", pageWidth / 2, yPos, { align: "center" });
        yPos += 15;

        // --- Request Details ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Request Details:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        doc.text(`Request ID: ${request._id}`, margin, yPos);
        yPos += 7;
        doc.text(`User Name: ${request.userName}`, margin, yPos);
        yPos += 7;
        doc.text(`User Email: ${request.userEmail}`, margin, yPos);
        yPos += 7;
        doc.text(`Requested Amount: ${request.amount} coins`, margin, yPos);
        yPos += 7;
        doc.text(`Requested Date: ${new Date(request.requestedAt).toLocaleDateString()} ${new Date(request.requestedAt).toLocaleTimeString()}`, margin, yPos);
        yPos += 15;

        // --- Status ---
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Status:", margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setTextColor(darkTextColor);
        const statusText = request.status.charAt(0).toUpperCase() + request.status.slice(1);
        doc.text(statusText, margin, yPos);
        yPos += 15;

        // --- Receipt Image ---
        if (request.receiptImageUrl && receiptImageData && receiptImageData.dataUrl) {
            doc.setFontSize(14);
            doc.setTextColor(primaryColor);
            doc.text("Attached Receipt:", margin, yPos);
            yPos += 7;

            const imgWidth = 80; // Fixed width for receipt image
            const imgAspectRatio = receiptImageData.width / receiptImageData.height;
            const imgHeight = imgWidth / imgAspectRatio;

            // Ensure image fits on page, add new page if needed
            if (yPos + imgHeight > pageHeight - margin - 20) { // 20 for footer
                doc.addPage();
                yPos = margin;
            }
            doc.addImage(receiptImageData.dataUrl, 'PNG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
        } else if (request.receiptImageUrl) {
            doc.setFontSize(12);
            doc.setTextColor(darkTextColor);
            doc.text(`Receipt Image URL: ${request.receiptImageUrl} (could not load image)`, margin, yPos);
            yPos += 15;
        }


        // --- Footer ---
        doc.setFontSize(10);
        doc.setTextColor(darkTextColor);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, pageHeight - 10);
        doc.text("Pabna University of Science and Technology", pageWidth - margin, pageHeight - 10, { align: "right" });


        doc.save(`coin_receipt_${request._id}.pdf`);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Coin Requests</h2>
                <div className="flex gap-2">
                    {user?.isSuperAdmin && (
                        <button
                            onClick={() => setIsCoinValueModalOpen(true)}
                            className="btn px-5 bg-red-600 hover:bg-red-800 text-white font-bold"
                        >
                            Maintain Coin Value
                        </button>
                    )}
                    <button
                        onClick={handleDownloadCsv}
                        className="btn px-5 bg-blue-600 hover:bg-blue-800 text-white font-bold"
                    >
                        Download Report
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <button
                    className={`btn px-5 border ${activeTab === 'pending' ? 'bg-red-600 text-white' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Requests
                </button>
                <button
                    className={`btn px-5 border ${activeTab === 'approved' ? 'bg-green-600 text-white' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    Approved Requests
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="input input-bordered border px-5 w-full md:w-1/2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="input input-bordered  w-full md:w-fit px-5 border"
                    placeholderText="Filter by date"
                    isClearable
                    highlightDates={getHighlightDates()}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-black bg-white border">
                        <thead className={`${activeTab === 'pending' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                            <tr>
                                <th className="px-4 py-2 text-left">User Name</th>
                                <th className="px-4 py-2 text-left">User Email</th>
                                <th className="px-4 py-2 text-left">Amount</th>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">Download</th> {/* New Download Header */}
                                {activeTab === 'pending' && <th className="px-4 py-2 text-left">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(request => (
                                <tr key={request._id} className="border-t hover:bg-gray-100">
                                    <td className="px-4 py-2">{request.userName}</td>
                                    <td className="px-4 py-2">{request.userEmail}</td>
                                    <td className="px-4 py-2">{request.amount}</td>
                                    <td className="px-4 py-2">{new Date(request.requestedAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2"> {/* New TD for Download button */}
                                        <button
                                            onClick={() => handleDownloadCoinReceipt(request)}
                                            className="btn btn-sm btn-info text-white bg-blue-400 flex items-center gap-1"
                                        >
                                            <FaDownload />
                                        </button>
                                    </td>
                                    {activeTab === 'pending' && (
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setIsModalOpen(true);
                                                }}
                                                className="btn px-5 bg-blue-500 text-white"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedRequest && (
                <CoinRequestDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    request={selectedRequest}
                    onApprove={() => handleRequestUpdate(selectedRequest.userId, selectedRequest._id, 'approved')}
                    onReject={() => handleRequestUpdate(selectedRequest.userId, selectedRequest._id, 'rejected')}
                />
            )}
            <SetCoinValueModal
                isOpen={isCoinValueModalOpen}
                onClose={() => {
                    setIsCoinValueModalOpen(false);
                    fetchCoinValue();
                }}
                currentCoinValue={coinValue}
                lastUpdatedAt={lastUpdatedAt}
            />
        </div>
    );
};

export default CoinRequests;


