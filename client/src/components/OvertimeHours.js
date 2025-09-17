import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

moment.locale('es');

const OvertimeHours = () => {
  const [overtimeData, setOvertimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({});
  const [nextUpdate, setNextUpdate] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(0); // 0 = actual, -1 = anterior, etc.
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detail'
  const [detailData, setDetailData] = useState([]);
  const [userFilter, setUserFilter] = useState(''); // Filter by user name
  const contentRef = useRef(null); // Reference for PDF export

  // Calculate date range for a specific period offset
  const calculateDateRange = (periodOffset = 0) => {
    const now = moment();
    const currentDay = now.date();
    
    // Calculate the base month for the period
    let baseMonth = now.clone();
    if (currentDay > 16) {
      // Si estamos después del día 16, el período actual es del mes actual
      baseMonth = now.clone();
    } else {
      // Si estamos en el día 16 o antes, el período actual es del mes anterior
      baseMonth = now.clone().subtract(1, 'month');
    }
    
    // Apply the period offset
    const targetMonth = baseMonth.clone().add(periodOffset, 'month');
    
    // Calculate the period: 16th of target month to 15th of next month
    const startDate = targetMonth.clone().date(16);
    const endDate = targetMonth.clone().add(1, 'month').date(15);
    
    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      label: `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`,
      monthLabel: startDate.format('MMMM YYYY'),
      periodOffset: periodOffset
    };
  };

  // Generate available periods (current + 6 months back)
  const generateAvailablePeriods = () => {
    const periods = [];
    for (let i = 0; i >= -6; i--) {
      const period = calculateDateRange(i);
      periods.push({
        ...period,
        isCurrent: i === 0
      });
    }
    return periods;
  };

  useEffect(() => {
    // Initialize available periods
    const periods = generateAvailablePeriods();
    setAvailablePeriods(periods);
    
    const updateDateRange = (periodOffset = 0) => {
      const range = calculateDateRange(periodOffset);
      setDateRange(range);
      fetchOvertimeHours(range.startDate, range.endDate);
    };

    // Actualizar inmediatamente con el período actual
    updateDateRange(currentPeriod);

    // Configurar actualización automática cada día a las 00:00
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Actualizar el estado de próxima actualización
    setNextUpdate(tomorrow);
    
    // Timer para medianoche
    const midnightTimer = setTimeout(() => {
      updateDateRange();
      
      // Configurar actualización diaria
      const dailyTimer = setInterval(updateDateRange, 24 * 60 * 60 * 1000);
      
      // Cleanup del timer diario
      return () => clearInterval(dailyTimer);
    }, timeUntilMidnight);

    // Cleanup del timer de medianoche
    return () => clearTimeout(midnightTimer);
  }, []);

  const fetchOvertimeHours = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/overtime/hours', {
        params: { startDate, endDate }
      });
      
      if (response.data.success) {
        setOvertimeData(response.data.overtimeData);
      } else {
        setError('Error al cargar las horas extras');
      }
    } catch (error) {
      console.error('Error fetching overtime hours:', error);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailData = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/overtime/detail', {
        params: { startDate, endDate }
      });
      
      if (response.data.success) {
        setDetailData(response.data.detailData);
      } else {
        setError('Error al cargar los detalles');
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    const range = calculateDateRange(currentPeriod);
    if (viewMode === 'summary') {
      fetchOvertimeHours(range.startDate, range.endDate);
    } else {
      fetchDetailData(range.startDate, range.endDate);
    }
  };

  // Export to PDF function
  const exportToPDF = async () => {
    if (!contentRef.current) return;

    try {
      // Show loading state
      const exportButton = document.querySelector('[data-export-button]');
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.textContent = 'Generando PDF...';
      }

      // Capture the content
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with current date and period
      const currentDate = moment().format('YYYY-MM-DD');
      const periodLabel = dateRange.label || 'periodo-actual';
      const filename = `horas-extras-${periodLabel}-${currentDate}.pdf`;

      // Save the PDF
      pdf.save(filename);

      // Reset button state
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'Exportar';
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
      
      // Reset button state
      const exportButton = document.querySelector('[data-export-button]');
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = 'Exportar';
      }
    }
  };

  const changePeriod = (newPeriodOffset) => {
    setCurrentPeriod(newPeriodOffset);
    const range = calculateDateRange(newPeriodOffset);
    setDateRange(range);
    if (viewMode === 'summary') {
      fetchOvertimeHours(range.startDate, range.endDate);
    } else {
      fetchDetailData(range.startDate, range.endDate);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'summary' ? 'detail' : 'summary';
    setViewMode(newMode);
    const range = calculateDateRange(currentPeriod);
    if (newMode === 'summary') {
      fetchOvertimeHours(range.startDate, range.endDate);
    } else {
      fetchDetailData(range.startDate, range.endDate);
    }
  };

  const goToPreviousPeriod = () => {
    if (currentPeriod > -6) {
      changePeriod(currentPeriod - 1);
    }
  };

  const goToNextPeriod = () => {
    if (currentPeriod < 0) {
      changePeriod(currentPeriod + 1);
    }
  };

  const goToCurrentPeriod = () => {
    changePeriod(0);
  };

  // Calculate totals
  const calculateTotals = () => {
    let total50 = 0;
    let total100 = 0;
    
    overtimeData.forEach(user => {
      user.rates.forEach(rate => {
        if (rate.rate === '50%') {
          total50 += rate.hours;
        } else if (rate.rate === '100%') {
          total100 += rate.hours;
        }
      });
    });
    
    return {
      total50: total50.toFixed(1),
      total100: total100.toFixed(1),
      grandTotal: (total50 + total100).toFixed(1)
    };
  };

  const totals = calculateTotals();

  // Render detailed view
  const renderDetailView = () => {
    if (detailData.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos detallados</h3>
          <p className="text-gray-500">No se encontraron tickets con horas extras para este período.</p>
        </div>
      );
    }

    // Filter and sort data
    const filteredData = detailData
      .filter(entry => 
        userFilter === '' || 
        entry.userName.toLowerCase().includes(userFilter.toLowerCase())
      )
      .sort((a, b) => a.userName.localeCompare(b.userName));

    // Get unique users for filter dropdown
    const uniqueUsers = [...new Set(detailData.map(entry => entry.userName))].sort();

    return (
      <div className="space-y-6">
        {/* User Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filtrar por usuario:</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los usuarios</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <div className="text-sm text-gray-500">
              Mostrando {filteredData.length} de {detailData.length} tickets
            </div>
          </div>
        </div>

        {/* Detailed table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Detalle de Tickets - Horas Extras</h3>
            <p className="text-sm text-gray-600">Período: {dateRange.label}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{entry.ticketNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.userName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.description || 'Sin descripción'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moment(entry.completedDate).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.rate === 1.5 
                          ? 'bg-blue-100 text-blue-800' 
                          : entry.rate === 2.0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        ${entry.rate.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(entry.hours).toFixed(2)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horas extras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" ref={contentRef}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Horas Extras</h1>
            <p className="text-gray-600 mt-2">
              Período: {dateRange.label}
            </p>
            {nextUpdate && currentPeriod === 0 && (
              <p className="text-sm text-blue-600 mt-1">
                🔄 Próxima actualización: {nextUpdate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleViewMode}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                viewMode === 'summary' 
                  ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2" />
              </svg>
              {viewMode === 'summary' ? 'Vista Detallada' : 'Vista Resumen'}
            </button>
            <button
              onClick={refreshData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={exportToPDF}
              data-export-button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar PDF
            </button>
          </div>
        </div>
        
        {/* Period Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Seleccionar Período</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPeriod}
                disabled={currentPeriod <= -6}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              
              <select
                value={currentPeriod}
                onChange={(e) => changePeriod(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availablePeriods.map((period) => (
                  <option key={period.periodOffset} value={period.periodOffset}>
                    {period.monthLabel} {period.isCurrent ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
              
              <button
                onClick={goToNextPeriod}
                disabled={currentPeriod >= 0}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg flex items-center gap-1"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {currentPeriod !== 0 && (
                <button
                  onClick={goToCurrentPeriod}
                  className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Actual
                </button>
              )}
            </div>
          </div>
          
          {/* Period History */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {availablePeriods.map((period) => (
              <button
                key={period.periodOffset}
                onClick={() => changePeriod(period.periodOffset)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  currentPeriod === period.periodOffset
                    ? 'bg-blue-500 text-white'
                    : period.isCurrent
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-xs opacity-75">
                  {period.startDate.split('-')[1]}/{period.startDate.split('-')[0]}
                </div>
                <div className="font-semibold">
                  {period.monthLabel.split(' ')[0]}
                </div>
                {period.isCurrent && (
                  <div className="text-xs opacity-75">Actual</div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Summary Cards - Only show in summary view */}
        {viewMode === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Horas 50%</p>
                  <p className="text-2xl font-bold">{totals.total50}h</p>
                </div>
                <div className="text-blue-200 text-3xl">50%</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Horas 100%</p>
                  <p className="text-2xl font-bold">{totals.total100}h</p>
                </div>
                <div className="text-green-200 text-3xl">100%</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total General</p>
                  <p className="text-2xl font-bold">{totals.grandTotal}h</p>
                </div>
                <div className="text-purple-200 text-3xl">∑</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'summary' ? (
        /* Summary Table */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overtimeData.map((user, userIndex) => (
                  <React.Fragment key={user.userId}>
                    {user.rates.map((rate, rateIndex) => (
                      <tr 
                        key={`${user.userId}-${rate.rate}`}
                        className={rateIndex === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {rateIndex === 0 ? (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.userName}
                          </td>
                        ) : (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {/* Empty cell for subsequent rows */}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rate.rate === '50%' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {rate.rate}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {rate.hours.toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                
                {/* Grand Total Row */}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Total General
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Empty cell */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    {totals.grandTotal}h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detail View */
        renderDetailView()
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Información del Período
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• <strong>Rate 1.5:</strong> Se cuenta como <strong>50%</strong> (horas extras)</p>
              <p>• <strong>Rate 2.0:</strong> Se cuenta como <strong>100%</strong> (horas extras)</p>
              <p>• <strong>Rate 1.0:</strong> No se incluye (horas normales)</p>
              <p>• <strong>Período:</strong> Del 16 del mes anterior al 15 del mes actual</p>
              {currentPeriod !== 0 && (
                <p className="mt-2 text-orange-600 font-semibold">
                  📅 Visualizando período histórico: {dateRange.monthLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OvertimeHours;
