import React, { useState, useEffect } from 'react';
import { Clock, Users, Download, TrendingUp } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';

const HoursSummary = () => {
  const [hoursData, setHoursData] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    setDefaultDates();
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchHoursSummary();
    }
  }, [startDate, endDate]);

  const setDefaultDates = () => {
    const end = moment();
    const start = period === 'week' ? moment().subtract(7, 'days') : moment().subtract(30, 'days');
    
    setEndDate(end.format('YYYY-MM-DD'));
    setStartDate(start.format('YYYY-MM-DD'));
  };

  const fetchHoursSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/hours/technicians-table', {
        params: { 
          startDate, 
          endDate 
        }
      });
      
      if (response.data.success) {
        setHoursData(response.data.hoursByTechnician);
        setTechnicians(response.data.technicians);
        setDates(response.data.dates);
      } else {
        setHoursData({});
        setTechnicians([]);
        setDates([]);
      }
    } catch (error) {
      console.error('Error fetching hours summary:', error);
      setHoursData({});
      setTechnicians([]);
      setDates([]);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = Object.values(hoursData).reduce((sum, data) => sum + (data.total || 0), 0);
  const totalEntries = Object.values(hoursData).reduce((sum, data) => sum + (data.entries || 0), 0);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resumen de Horas</h1>
        <p className="text-gray-600 mt-2">
          Horas subidas por técnico - Período: {startDate} a {endDate}
        </p>
      </div>

      {/* Controls */}
      <div className="dashboard-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">


          {/* Period Selector */}
          <div className="flex gap-4">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'week'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Última Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'month'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Último Mes
            </button>
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500 self-center">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Export Button */}
          <button className="btn-primary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Horas</p>
              <p className="text-3xl font-bold mt-2">{totalHours.toFixed(2)}h</p>
            </div>
            <Clock className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-r from-green-500 to-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Entradas</p>
              <p className="text-3xl font-bold mt-2">{totalEntries}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-r from-purple-500 to-violet-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Promedio por Técnico</p>
              <p className="text-3xl font-bold mt-2">
                {technicians.length > 0 ? (totalHours / technicians.length).toFixed(2) : 0}h
              </p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Hours Table - Similar to MSP Manager */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          -Homs subidas-
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-bold text-gray-900 bg-gray-100">
                  Técnico
                </th>
                {dates.map((date, index) => (
                  <th key={index} className="text-center py-3 px-2 font-bold text-gray-900 bg-gray-100 min-w-[80px]">
                    {moment(date).format('MM/DD')}
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-bold text-gray-900 bg-gray-100 min-w-[100px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 ? (
                <tr>
                  <td colSpan={dates.length + 2} className="text-center py-8 text-gray-500">
                    No se encontraron datos de horas
                  </td>
                </tr>
              ) : (
                technicians.map((technician) => {
                  const technicianData = hoursData[technician] || {};
                  const totalTechnicianHours = technicianData.total || 0;
                  
                  return (
                    <tr key={technician} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {technician}
                      </td>
                      {dates.map((date, index) => {
                        const dateStr = moment(date).format('YYYY-MM-DD');
                        const hoursForDate = technicianData[dateStr] || 0;
                        const cellColor = hoursForDate >= 6 ? 'text-green-600' : 'text-yellow-600';
                        
                        return (
                          <td key={index} className={`text-center py-3 px-2 font-medium ${cellColor}`}>
                            {hoursForDate > 0 ? hoursForDate.toFixed(1) : '0'}
                          </td>
                        );
                      })}
                      <td className="text-center py-3 px-4 font-bold text-blue-600 bg-blue-50">
                        {totalTechnicianHours.toFixed(1)}h
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HoursSummary;

