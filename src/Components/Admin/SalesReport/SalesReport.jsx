import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const SalesReport = () => {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonthNumber, setSelectedMonthNumber] = useState('');
  const [viewType, setViewType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [eventAnalytics, setEventAnalytics] = useState(null);
  const [overallAnalytics, setOverallAnalytics] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [totalCash, setTotalCash] = useState(0);
  const [totalPaidWithCoins, setTotalPaidWithCoins] = useState(0);

  useEffect(() => {
    fetchAvailableMonths();
    fetchOverallAnalytics();
  }, []);

  useEffect(() => {
    if (selectedYear && selectedMonthNumber) {
      generateMonthDays();
    }
  }, [selectedYear, selectedMonthNumber]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, viewType, selectedDate, selectedWeek, currentPage]);

  const fetchData = () => {
    let startDate, endDate;

    if (viewType === 'daily' && selectedDate) {
        startDate = selectedDate;
        endDate = new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (viewType === 'weekly' && selectedWeek) {
        const [start, end] = selectedWeek.split('_to_');
        startDate = start;
        const endDateObj = new Date(Date.parse(end + 'T00:00:00Z'));
        endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
        endDate = endDateObj.toISOString().split('T')[0];
    } else if (selectedMonth) {
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonthNumber);
        startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString().split('T')[0];
        endDate = new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0];
    }

    if (startDate && endDate) {
        fetchSalesData(startDate, endDate);
        fetchEventData(startDate, endDate);
    } else {
        setSalesData([]);
        setEventBookings([]);
        setAnalytics(null);
        setEventAnalytics(null);
        setPagination(null);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let startDate, endDate, filename;
      const now = new Date();

      // Determine date range
      if (viewType === 'daily' && selectedDate) {
        startDate = selectedDate;
        endDate = new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filename = `report_daily_${selectedDate}.csv`;
      } else if (viewType === 'weekly' && selectedWeek) {
        const [start, end] = selectedWeek.split('_to_');
        startDate = start;
        endDate = new Date(new Date(end).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filename = `report_weekly_${start}_to_${end}.csv`;
      } else if (selectedMonth) {
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonthNumber);
        startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString().split('T')[0];
        endDate = new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0];
        filename = `report_monthly_${selectedYear}-${selectedMonthNumber}.csv`;
      } else {
        toast.warning('Please select a period to download.');
        setIsDownloading(false);
        return;
      }

      // Fetch both sales and event data in parallel
      const [salesResponse, eventsResponse] = await Promise.all([
        fetch(`https://central-cafetaria-server.vercel.app/api/sales/download?startDate=${startDate}&endDate=${endDate}`),
        fetch(`https://central-cafetaria-server.vercel.app/api/events/range?startDate=${startDate}&endDate=${endDate}`)
      ]);

      if (!salesResponse.ok || !eventsResponse.ok) {
        throw new Error('Failed to download report data');
      }

      const salesData = await salesResponse.json();
      const eventData = await eventsResponse.json();

      if (salesData.length === 0 && eventData.length === 0) {
        toast.info('No data available for the selected period to download.');
        return;
      }
      
      let combinedCsvContent = '';

      // --- Sales CSV Generation ---
      if (salesData.length > 0) {
        const salesHeaders = ['Order ID', 'Date', 'Time', 'Items', 'Total Price', 'Status', 'Paid with Coins'];
        combinedCsvContent += salesHeaders.join(',') + '\n';

        salesData.forEach(sale => {
          const items = `"${sale.orderDetails.map(item => `${item.name} (x${item.unit})`).join(', ')}"`;
          const row = [
            sale.queueId,
            new Date(sale.placedAt).toLocaleDateString(),
            new Date(sale.placedAt).toLocaleTimeString(),
            items,
            (sale.totalPrice ?? 0).toFixed(2),
            sale.status,
            sale.paidWithCoins ? 'Yes' : 'No'
          ];
          combinedCsvContent += row.join(',') + '\n';
        });
      }

      // Add a spacer if both datasets exist
      if (salesData.length > 0 && eventData.length > 0) {
        combinedCsvContent += '\n\n';
      }

      // --- Event CSV Generation ---
      if (eventData.length > 0) {
        const eventHeaders = ['Event Date', 'Booked By', 'Package', 'Quantity', 'Total Price', 'Payment Status'];
        combinedCsvContent += eventHeaders.join(',') + '\n';

        eventData.forEach(booking => {
           const packagePrice = booking.selectedPackage?.price || 0;
           const packageQuantity = parseInt(booking.packageQuantity, 10) || 0;
           const row = [
              new Date(booking.eventDate).toLocaleDateString(),
              `"${booking.name}"`,
              `"${booking.selectedPackage?.name || 'N/A'}"`,
              packageQuantity,
              (packageQuantity * packagePrice).toFixed(2),
              booking.paymentStatus
           ];
           combinedCsvContent += row.join(',') + '\n';
        });
      }

      const combinedBlob = new Blob(['\uFEFF' + combinedCsvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(combinedBlob, filename);

    } catch (err) {
      toast.error('Failed to download report.');
      setError('Failed to download report.');
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchOverallAnalytics = async (year, month) => {
    try {
      let url = 'https://central-cafetaria-server.vercel.app/api/sales/overall-analytics';
      if (year && month) {
        url += `?year=${year}&month=${month}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOverallAnalytics(data);
    } catch (err) {
      toast.error('Error fetching overall analytics.');
    }
  };

  const fetchAvailableMonths = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://central-cafetaria-server.vercel.app/api/sales/months');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Months data from API:', data);
      
      // Format the months data to match our expected structure
      const formattedMonths = data.map(month => ({
        year: month.year,
        month: month.month,
        label: new Date(month.year, month.month - 1).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
      }));
      
      setMonths(formattedMonths);
    } catch (err) {
      toast.error(`Failed to load months: ${err.message}`);
      setError(`Failed to load months: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthDays = () => {
    if (!selectedYear || !selectedMonthNumber) return;
    
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonthNumber);
    const dates = [];
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      dates.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        })
      });
    }
    
    setAvailableDates(dates.reverse()); // Most recent first
  };

  const fetchSalesData = async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    setTotalCash(0);
    setTotalPaidWithCoins(0);
    try {
        const response = await fetch(
            `https://central-cafetaria-server.vercel.app/api/sales/range?startDate=${startDate}&endDate=${endDate}&page=${currentPage}&limit=100`
        );
        if (!response.ok) throw new Error('Failed to fetch sales data');
        const data = await response.json();
        const sales = data.data || [];
        setSalesData(sales);
        setAnalytics(data.analytics);
        setPagination(data.pagination);

        // Calculate cash and coin totals
        const cashTotal = sales
            .filter(sale => !sale.paidWithCoins)
            .reduce((acc, sale) => acc + sale.totalPrice, 0);
        const coinTotal = sales
            .filter(sale => sale.paidWithCoins)
            .reduce((acc, sale) => acc + sale.totalPrice, 0);

        setTotalCash(cashTotal);
        setTotalPaidWithCoins(coinTotal);

    } catch (err) {
        toast.error(err.message);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const fetchEventData = async (startDate, endDate) => {
    try {
        const [bookingsRes, analyticsRes] = await Promise.all([
            fetch(`https://central-cafetaria-server.vercel.app/api/events/range?startDate=${startDate}&endDate=${endDate}`),
            fetch(`https://central-cafetaria-server.vercel.app/api/events/analytics-range?startDate=${startDate}&endDate=${endDate}`)
        ]);

        if (!bookingsRes.ok) throw new Error('Failed to fetch event bookings');
        const bookingsData = await bookingsRes.json();
        setEventBookings(bookingsData);

        if (!analyticsRes.ok) throw new Error('Failed to fetch event analytics');
        const analyticsData = await analyticsRes.json();
        setEventAnalytics(analyticsData);

    } catch (err) {
        toast.error(err.message);
        setError(err.message);
    }
  };

  const getWeeksInMonth = () => {
    if (!selectedYear || !selectedMonthNumber) return [];
    
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonthNumber);
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));
    
    const weeks = [];
    let currentWeekStart = new Date(Date.UTC(year, month - 1, 1));
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setUTCDate(currentWeekStart.getUTCDate() + 6);
      
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime());
      }
      
      weeks.push({
        start: currentWeekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
        label: `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
      });
      
      currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);
    }
    
    return weeks.reverse(); // Most recent first
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setSelectedMonth(value);
    
    if (value) {
      const [year, month] = value.split('-');
      setSelectedYear(year);
      setSelectedMonthNumber(month);
      fetchOverallAnalytics(year, month);
    } else {
      setSelectedYear('');
      setSelectedMonthNumber('');
      fetchOverallAnalytics();
    }
    
    setSelectedDate('');
    setSelectedWeek('');
    setSalesData([]);
    setEventBookings([]);
    setAnalytics(null);
    setEventAnalytics(null);
    setCurrentPage(1);
  };

  const handleViewTypeChange = (type) => {
    setViewType(type);
    setSelectedDate('');
    setSelectedWeek('');
    setSalesData([]);
    setEventBookings([]);
    setAnalytics(null);
    setEventAnalytics(null);
    setCurrentPage(1);
  };
  
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSalesData([]);
    setEventBookings([]);
    setAnalytics(null);
    setEventAnalytics(null);
    setCurrentPage(1);
  };

  const handleWeekChange = (e) => {
    setSelectedWeek(e.target.value);
    setSalesData([]);
    setEventBookings([]);
    setAnalytics(null);
    setEventAnalytics(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleReset = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedMonthNumber('');
    setViewType('daily');
    setSelectedDate('');
    setSelectedWeek('');
    setSalesData([]);
    setAnalytics(null);
    setCurrentPage(1);
    setAvailableDates([]);
    fetchOverallAnalytics();
  };



    const renderFilters = () => {

    const downloadButtonText = () => {

      if (viewType === 'daily' && selectedDate) return 'Download Daily Report';

      if (viewType === 'weekly' && selectedWeek) return 'Download Weekly Report';

      if (selectedMonth) return 'Download Monthly Report';

      return 'Download Report';

    };

  

    const isDownloadDisabled = () => {

      if (isDownloading) return true;

      const text = downloadButtonText();

      if (text === 'Download Report') return true; // No period selected

      return false;

    };

  

    const getSelectedPeriodInfo = () => {

      if (viewType === 'daily' && selectedDate) {

        return `Viewing: ${new Date(selectedDate).toLocaleDateString('en-US', { 

          weekday: 'long', 

          year: 'numeric', 

          month: 'long', 

          day: 'numeric' 

        })}`;

      }

      if (viewType === 'weekly' && selectedWeek) {

        const [start, end] = selectedWeek.split('_to_');

        return `Viewing: ${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      }

      if (selectedMonth) {

        return `Viewing: ${months.find(m => `${m.year}-${m.month}` === selectedMonth)?.label || selectedMonth}`;

      }

      return 'Select a period to view sales data';

    };

  

    return (

      <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm mb-6">

        {/* Header */}

        <div className="px-6 py-4 border-b border-base-300 bg-base-200 rounded-t-xl">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <h2 className="text-lg font-semibold text-base-content">Sales Period Selection</h2>

              <p className="text-sm text-base-content/70 mt-1">Choose a time period to analyze sales data</p>

            </div>

            <div className="flex items-center gap-3">

              {/* Quick Stats Badge */}

              {analytics && (

                <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">

                  <div className="w-2 h-2 bg-primary rounded-full"></div>

                  <span className="text-sm font-medium">

                    {analytics.totalOrders} orders • {analytics.totalRevenue?.toFixed(2)} tk

                  </span>

                </div>

              )}

              

              {/* Download Button */}

              <button

                className={`btn gap-2 transition-all duration-200 ${

                  isDownloadDisabled() 

                    ? 'btn-disabled' 

                    : 'btn-accent hover:btn-accent/90 shadow-sm'

                }`}

                onClick={handleDownload}

                disabled={isDownloadDisabled()}

              >

                {isDownloading ? (

                  <>

                    <span className="loading loading-spinner loading-sm"></span>

                    Downloading...

                  </>

                ) : (

                  <>

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                    </svg>

                    {downloadButtonText()}

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

  

        {/* Filters Grid */}

        <div className="p-6">

          {/* Selected Period Info */}

          <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-lg">

            <div className="flex items-center gap-3">

              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

              </svg>

              <span className="text-blue-700 dark:text-blue-300 font-medium">{getSelectedPeriodInfo()}</span>

            </div>

          </div>

  

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Month Selection - Full width on mobile, 4 cols on desktop */}

            <div className="lg:col-span-4">

              <div className="form-control">

                <label className="label pb-2">

                  <span className="label-text font-semibold text-base-content flex items-center gap-2">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

                    </svg>

                    Select Month

                  </span>

                </label>

                <select 

                  className="select select-bordered w-full bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"

                  value={selectedMonth}

                  onChange={handleMonthChange}

                >

                  <option value="" className="text-base-content/50">Choose a month...</option>

                  {months.map((month) => (

                    <option 

                      key={`${month.year}-${month.month}`} 

                      value={`${month.year}-${month.month}`}

                      className="text-base-content"

                    >

                      {month.label}

                    </option>

                  ))}

                </select>

              </div>

            </div>

  

            {/* View Type Toggle - Full width on mobile, 3 cols on desktop */}

            <div className="lg:col-span-3">

              <div className="form-control">

                <label className="label pb-2">

                  <span className="label-text font-semibold text-base-content flex items-center gap-2">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />

                    </svg>

                    View Type

                  </span>

                </label>

                <div className="join w-full shadow-sm">

                  <button

                    className={`join-item btn flex-1 transition-all ${

                      viewType === 'daily' 

                        ? 'btn-primary shadow-sm' 

                        : 'btn-outline hover:bg-base-200'

                    }`}

                    onClick={() => handleViewTypeChange('daily')}

                  >

                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

                    </svg>

                    Daily

                  </button>

                  <button

                    className={`join-item btn flex-1 transition-all ${

                      viewType === 'weekly' 

                        ? 'btn-primary shadow-sm' 

                        : 'btn-outline hover:bg-base-200'

                    }`}

                    onClick={() => handleViewTypeChange('weekly')}

                  >

                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />

                    </svg>

                    Weekly

                  </button>

                </div>

              </div>

            </div>

  

            {/* Date/Week Selection - Full width on mobile, 3 cols on desktop */}

            <div className="lg:col-span-3">

              <div className="form-control">

                <label className="label pb-2">

                  <span className="label-text font-semibold text-base-content flex items-center gap-2">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

                    </svg>

                    {viewType === 'daily' ? 'Select Date' : 'Select Week'}

                  </span>

                </label>

                {viewType === 'daily' ? (

                  <select 

                    className="select select-bordered w-full bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"

                    value={selectedDate}

                    onChange={handleDateChange}

                    disabled={!selectedMonth}

                  >

                    <option value="" className="text-base-content/50">

                      {!selectedMonth ? 'Select month first' : 'Choose a date...'}

                    </option>

                    {availableDates.map((date) => (

                      <option key={date.date} value={date.date} className="text-base-content">

                        {date.label}

                      </option>

                    ))}

                  </select>

                ) : (

                  <select 

                    className="select select-bordered w-full bg-base-100 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"

                    value={selectedWeek}

                    onChange={handleWeekChange}

                    disabled={!selectedMonth}

                  >

                    <option value="" className="text-base-content/50">

                      {!selectedMonth ? 'Select month first' : 'Choose a week...'}

                    </option>

                    {getWeeksInMonth().map((week) => (

                      <option key={`${week.start}_to_${week.end}`} value={`${week.start}_to_${week.end}`} className="text-base-content">

                        {week.label}

                      </option>

                    ))}

                  </select>

                )}

              </div>

            </div>

  

            {/* Quick Actions - Full width on mobile, 2 cols on desktop */}

            <div className="lg:col-span-2">

              <div className="form-control">

                <label className="label pb-2 invisible">

                  <span className="label-text font-semibold">Actions</span>

                </label>

                <div className="flex flex-col gap-2">

                  {/* Mobile Download Button - Hidden on desktop */}

                  <button

                    className={`btn btn-accent gap-2 lg:hidden ${

                      isDownloadDisabled() ? 'btn-disabled' : 'hover:btn-accent/90 shadow-sm'

                    }`}

                    onClick={handleDownload}

                    disabled={isDownloadDisabled()}

                  >

                    {isDownloading ? (

                      <span className="loading loading-spinner loading-sm"></span>

                    ) : (

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                      </svg>

                    )}

                    {isDownloading ? 'Downloading...' : 'Download'}

                  </button>

  

                  {/* Refresh Button */}

                  <button

                    className="btn btn-outline gap-2 hover:bg-base-200 transition-colors"

                    onClick={() => fetchAvailableMonths()}

                    disabled={loading}

                  >

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />

                    </svg>

                    Refresh

                  </button>

                  <button

                    className="btn btn-outline gap-2 hover:bg-base-200 transition-colors"

                    onClick={handleReset}

                  >

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                    </svg>

                    Reset

                  </button>

                </div>

              </div>

            </div>

          </div>

  

          {/* Mobile Quick Stats - Hidden on desktop */}

          {analytics && (

            <div className="mt-4 p-3 bg-base-200 rounded-lg sm:hidden">

              <div className="grid grid-cols-2 gap-4 text-sm">

                <div className="text-center">

                  <div className="font-semibold text-base-content">Total Orders</div>

                  <div className="text-lg font-bold text-primary">{analytics.totalOrders}</div>

                </div>

                <div className="text-center">

                  <div className="font-semibold text-base-content">Total Revenue</div>

                  <div className="text-lg font-bold text-secondary">${analytics.totalRevenue?.toFixed(2)}</div>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    );

  };

  

    const renderTable = () => {

      if (loading && salesData.length === 0) { // Show loading only if there's no data yet

        return (

          <div className="flex justify-center items-center p-8 col-span-1">

            <Spinner />

          </div>

        );

      }

  

      if (salesData.length === 0) {

        return (

          <div className="text-center p-8 bg-base-200 rounded-lg col-span-1">

            <h3 className="text-lg font-semibold mb-2">No sales data found</h3>

            <p className="text-base-content/70">No orders were served during this period.</p>

          </div>

        );

      }

  

      return (

        <div className="bg-base-100 rounded-lg shadow-sm border col-span-1">

          <h2 className="text-xl font-bold p-4">Sales Orders</h2>

          <div className="overflow-x-auto">

                        <table className="table table-zebra w-full">

                          <thead>

                            <tr className="bg-base-300">

                              <th className="font-bold">Order ID</th>

                              <th className="font-bold">Date & Time</th>

                              <th className="font-bold">Items</th>

                              <th className="font-bold text-right">Total Amount</th>

                              <th className="font-bold text-center">Paid with Coins</th>

                            </tr>

                          </thead>

                          <tbody>

                            {salesData.map((sale) => (

                              <tr key={sale._id} className="hover">

                                <td className="font-mono text-sm">{sale.queueId}</td>

                                <td>

                                  <div className="font-medium">{new Date(sale.placedAt).toLocaleDateString()}</div>

                                  <div className="text-xs text-base-content/60">{new Date(sale.placedAt).toLocaleTimeString()}</div>

                                </td>

                                <td>

                                  <div className="max-w-xs truncate" title={sale.orderDetails.map(item => `${item.name} (x${item.unit})`).join(', ')}>

                                    {sale.orderDetails.map(item => item.name).join(', ')}

                                  </div>

                                </td>

                                <td className="text-right font-bold text-success">{sale.totalPrice?.toFixed(2)} tk</td>

                                <td className="text-center">

                                  {sale.paidWithCoins ? (

                                    <span className="badge badge-success text-white">Yes</span>

                                  ) : (

                                    <span className="badge badge-error text-white">No</span>

                                  )}

                                </td>

                              </tr>

                            ))}

                          </tbody>

                        </table>

          </div>

        </div>

      );

    };

    

    const renderEventsTable = () => {

      if (loading && eventBookings.length === 0) return null;

  

      if (eventBookings.length === 0) {

        return (

          <div className="text-center p-8 bg-base-200 rounded-lg col-span-1">

              <h3 className="text-lg font-semibold mb-2">No Event Bookings</h3>

              <p className="text-base-content/70">No events were booked for this period.</p>

          </div>

        );

      }

  

      return (

          <div className="bg-base-100 rounded-lg shadow-sm border col-span-1">

              <h2 className="text-xl font-bold p-4">Event Bookings</h2>

              <div className="overflow-x-auto">

                  <table className="table table-zebra w-full">

                      <thead>

                          <tr className="bg-base-300">

                              <th className="font-bold">Event Date</th>

                              <th className="font-bold">Booked By</th>

                              <th className="font-bold">Package</th>

                              <th className="font-bold text-right">Total Amount</th>

                          </tr>

                      </thead>

                      <tbody>

                          {eventBookings.map((booking) => (

                              <tr key={booking._id} className="hover">

                                  <td>{new Date(booking.eventDate).toLocaleDateString()}</td>

                                  <td>{booking.name}</td>

                                  <td>{booking.selectedPackage.name} (x{booking.packageQuantity})</td>

                                  <td className="text-right font-bold text-success">{(booking.packageQuantity * booking.selectedPackage.price).toFixed(2)} tk</td>

                              </tr>

                          ))}

                      </tbody>

                  </table>

              </div>

          </div>

      );

    };

  

    const renderAnalytics = () => {

      const combinedRevenue = (analytics?.totalRevenue || 0) + (eventAnalytics?.totalRevenue || 0);

  

      if (!selectedMonth) return null;

  

      return (

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          <div className="stat bg-primary text-primary-content rounded-lg">

            <div className="stat-title text-primary-content">Total Revenue</div>

            <div className="stat-value">{combinedRevenue.toFixed(2)} tk </div>

            <div className="stat-desc">Sales + Events</div>

          </div>

          

          <div className="stat bg-secondary text-secondary-content rounded-lg">

            <div className="stat-title text-secondary-content">Total Orders</div>

            <div className="stat-value">{analytics?.totalOrders || 0}</div>

            <div className="stat-desc">Completed orders</div>

          </div>

          

          <div className="stat bg-success text-success-content rounded-lg">
            <div className="stat-title">Total Cash Sales</div>
            <div className="stat-value">{totalCash.toFixed(2)} tk</div>
            <div className="stat-desc">From sales</div>
          </div>

          <div className="stat bg-warning text-warning-content rounded-lg">
            <div className="stat-title">Total Coin Sales</div>
            <div className="stat-value">{totalPaidWithCoins.toFixed(2)} tk</div>
            <div className="stat-desc">From sales</div>
          </div>

          <div className="stat bg-info text-info-content rounded-lg">

            <div className="stat-title text-info-content">Total Event Bookings</div>

            <div className="stat-value">{eventAnalytics?.totalBookings || 0}</div>

            <div className="stat-desc">In this period</div>

          </div>

          

          <div className="stat bg-accent text-accent-content rounded-lg">

            <div className="stat-title">Avg. Order Value</div>

            <div className="stat-value">{analytics?.averageOrderValue?.toFixed(2) || 0} tk</div>

            <div className="stat-desc">From sales</div>

          </div>

        </div>

      );

    };

  

    const renderOverallAnalytics = () => {

      if (!overallAnalytics) return null;

  

      const headerText = selectedMonth 

        ? `Performance for ${new Date(selectedYear, selectedMonthNumber - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`

        : "This Month's Performance";

  

      return (

        <div className="mb-6">

          <h2 className="text-xl font-bold mb-2">{headerText}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="stat bg-primary text-primary-content rounded-lg">

              <div className="stat-title text-primary-content">Total Revenue</div>

              <div className="stat-value">{overallAnalytics.totalRevenue?.toFixed(2)} tk</div>

            </div>

            <div className="stat bg-secondary text-secondary-content rounded-lg">

              <div className="stat-title text-secondary-content">Total Orders</div>

              <div className="stat-value">{overallAnalytics.totalOrders}</div>

            </div>

          </div>

        </div>

      );

    };

  

    const renderPagination = () => {

      if (!pagination || pagination.totalPages <= 1) return null;

  

      return (

        <div className="flex justify-center items-center space-x-2 mt-6">

          <button

            className="btn btn-sm"

            disabled={currentPage === 1}

            onClick={() => handlePageChange(currentPage - 1)}

          >

            « Previous

          </button>

          <span className="text-sm">

            Page {currentPage} of {pagination.totalPages}

          </span>

          <button

            className="btn btn-sm"

            disabled={currentPage === pagination.totalPages}

            onClick={() => handlePageChange(currentPage + 1)}

          >

            Next »

          </button>

        </div>

      );

    };

  

    return (

      <div className="p-6 mx-auto">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-base-content">Sales & Events Dashboard</h1>

          <p className="text-base-content/70 mt-2">Comprehensive sales and events reporting</p>

        </div>

  

        {renderFilters()}

        {renderOverallAnalytics()}

        {renderAnalytics()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {renderTable()}

          {renderEventsTable()}

        </div>

        {renderPagination()}

      </div>

    );

  };

  export default SalesReport;

  