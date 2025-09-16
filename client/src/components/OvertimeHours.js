import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const OvertimeHours = () => {
  const [overtimeData, setOvertimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({});
  const [nextUpdate, setNextUpdate] = useState(null);

  // Calculate date range: 16th of previous month to 15th of current month
  const calculateDateRange = () => {
    const now = moment();
    const currentDay = now.date();
    
    if (currentDay >= 16) {
      // Si estamos en la segunda mitad del mes (día 16 o posterior)
      // Período: día 16 del mes actual al día 15 del mes siguiente
      const startDate = now.clone().date(16);
      const endDate = now.clone().add(1, 'month').date(15);
      
      return {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        label: `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`
      };
    } else {
      // Si estamos en la primera mitad del mes (día 1-15)
      // Período: día 16 del mes anterior al día 15 del mes actual
      const startDate = now.clone().subtract(1, 'month').date(16);
      const endDate = now.clone().date(15);
      
      return {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        label: `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`
      };
    }
  };

  useEffect(() => {
    // Cargar datos usando el período automático del backend
    fetchOvertimeHours();

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
      fetchOvertimeHours();
      
      // Configurar actualización diaria
      const dailyTimer = setInterval(fetchOvertimeHours, 24 * 60 * 60 * 1000);
      
      // Cleanup del timer diario
      return () => clearInterval(dailyTimer);
    }, timeUntilMidnight);

    // Cleanup del timer de medianoche
    return () => clearTimeout(midnightTimer);
  }, []);

  const fetchOvertimeHours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el sistema automático del backend - no enviar fechas
      const response = await axios.get('/api/overtime/hours');
      
      if (response.data.success) {
        setOvertimeData(response.data.overtimeData);
        // Actualizar el período con el que viene del backend
        if (response.data.period) {
          setDateRange({
            startDate: response.data.period.startDate,
            endDate: response.data.period.endDate,
            label: `${moment(response.data.period.startDate).format('DD/MM/YYYY')} - ${moment(response.data.period.endDate).format('DD/MM/YYYY')}`
          });
        }
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

  const refreshData = () => {
    fetchOvertimeHours();
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Horas Extras</h1>
            <p className="text-gray-600 mt-2">
              Período: {dateRange.label}
            </p>
            {nextUpdate && (
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
              onClick={refreshData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={() => window.print()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Exportar
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
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
      </div>

      {/* Overtime Table */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OvertimeHours;
