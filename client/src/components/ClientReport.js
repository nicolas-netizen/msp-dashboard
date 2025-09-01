import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Building, Clock } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';

const ClientReport = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);

  useEffect(() => {
    setDefaultDates();
    fetchClients();
  }, []);

  const setDefaultDates = () => {
    const end = moment();
    const start = moment().subtract(30, 'days');
    
    setEndDate(end.format('YYYY-MM-DD'));
    setStartDate(start.format('YYYY-MM-DD'));
  };

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const response = await axios.get('/api/clients');
      if (response.data.success) {
        setClients(response.data.clients);
        console.log('Clientes cargados desde API:', response.data.clients.length);
      } else {
        console.error('Error fetching clients:', response.data.error);
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };



  const generateReport = async () => {
    if (!selectedClient || !startDate || !endDate) {
      alert('Por favor selecciona un cliente y un rango de fechas');
      return;
    }

    try {
      setGenerating(true);
      const response = await axios.get('/api/reports/client-hours', {
        params: {
          clientId: selectedClient,
          startDate,
          endDate,
          format: 'json'
        }
      });
      
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format = 'csv') => {
    if (!selectedClient || !startDate || !endDate) {
      alert('Por favor selecciona un cliente y un rango de fechas');
      return;
    }

    try {
      setGenerating(true);
      const response = await axios.get('/api/reports/client-hours', {
        params: {
          clientId: selectedClient,
          startDate,
          endDate,
          format
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-horas-${selectedClient}-${startDate}-${endDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error al exportar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const getSelectedClientName = () => {
    const client = clients.find(c => c.id === selectedClient);
    return client ? client.name : '';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes de Horas para Cliente</h1>
        <p className="text-gray-600 mt-2">
          Genera y exporta reportes detallados de horas trabajadas por cliente
        </p>
      </div>

      {/* Client Statistics */}
      {clients.length > 0 && (
        <div className="dashboard-card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Clientes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Clientes</p>
                  <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Período Seleccionado</p>
                  <p className="text-lg font-bold text-green-900">
                    {startDate && endDate ? `${moment(startDate).format('DD/MM')} - ${moment(endDate).format('DD/MM')}` : 'No definido'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Última Actualización</p>
                  <p className="text-lg font-bold text-purple-900">
                    {moment().format('HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Configuration */}
      <div className="dashboard-card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Reporte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Cliente
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={clientsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {clientsLoading ? 'Cargando clientes...' : 'Seleccionar Cliente'}
              </option>
              {clients.length === 0 && !clientsLoading ? (
                <option value="" disabled>No hay clientes disponibles</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={generateReport}
            disabled={!selectedClient || !startDate || !endDate || generating}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? 'Generando...' : 'Generar Reporte'}
          </button>

          <button
            onClick={() => exportReport('csv')}
            disabled={!selectedClient || !startDate || !endDate || generating}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>

          <button
            onClick={async () => {
              try {
                console.log('🔍 Probando endpoint de debug...');
                const response = await axios.get('/api/clients/debug');
                console.log('Debug response:', response.data);
                alert('Debug completado. Revisa la consola para más detalles.');
              } catch (error) {
                console.error('Error en debug:', error);
                alert('Error en debug: ' + error.message);
              }
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🐛 Debug API
          </button>

          <button
            onClick={async () => {
              try {
                console.log('🔍 Probando conexión MSP...');
                const response = await axios.get('/api/test-msp-connection');
                console.log('Test MSP connection response:', response.data);
                alert('Test de conexión completado. Revisa la consola para más detalles.');
              } catch (error) {
                console.error('Error en test de conexión:', error);
                alert('Error en test de conexión: ' + error.message);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🌐 Test Conexión
          </button>

          <button
            onClick={async () => {
              try {
                console.log('🔍 Explorando campos disponibles...');
                const response = await axios.get('/api/explore-fields');
                console.log('Explore fields response:', response.data);
                alert('Exploración de campos completada. Revisa la consola para ver qué campos están disponibles.');
              } catch (error) {
                console.error('Error explorando campos:', error);
                alert('Error explorando campos: ' + error.message);
              }
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🔍 Explorar Campos
          </button>


        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="dashboard-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Reporte</h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportReport('csv')}
                className="btn-primary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </button>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Cliente</p>
                  <p className="text-lg font-bold text-blue-900">{getSelectedClientName()}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Horas</p>
                  <p className="text-lg font-bold text-green-900">{reportData.totalHours}h</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Entradas</p>
                  <p className="text-lg font-bold text-purple-900">{reportData.entries.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Ticket</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Descripción</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Horas</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Técnico</th>
                </tr>
              </thead>
              <tbody>
                {reportData.entries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No se encontraron entradas de horas para este período
                    </td>
                  </tr>
                ) : (
                  reportData.entries.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {moment(entry.Date).format('DD/MM/YYYY')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">#{entry.TicketId}</span>
                        {entry.TicketTitle && (
                          <p className="text-sm text-gray-500">{entry.TicketTitle}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">{entry.Description}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-blue-600">{entry.Hours}h</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">{entry.TechnicianName}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Report Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Reporte generado el: {moment(reportData.generatedAt).format('DD/MM/YYYY HH:mm')}</span>
              <span>Período: {moment(reportData.period.startDate).format('DD/MM/YYYY')} - {moment(reportData.period.endDate).format('DD/MM/YYYY')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        
        {clients.length === 0 && !clientsLoading ? (
          <div className="text-center py-8">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes disponibles</h3>
            <p className="text-gray-500 mb-4">
              Los clientes se cargan automáticamente desde la API de MSP Manager.
            </p>
            <button
              onClick={fetchClients}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              if (clients.length > 0) {
                setSelectedClient(clients[0].id);
              }
              setStartDate(moment().startOf('month').format('YYYY-MM-DD'));
              setEndDate(moment().endOf('month').format('YYYY-MM-DD'));
            }}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Reporte del Mes
          </button>
          
          <button 
            onClick={() => {
              setStartDate(moment().subtract(30, 'days').format('YYYY-MM-DD'));
              setEndDate(moment().format('YYYY-MM-DD'));
            }}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            Últimos 30 Días
          </button>
          
          <button 
            onClick={() => {
              setStartDate(moment().startOf('quarter').format('YYYY-MM-DD'));
              setEndDate(moment().endOf('quarter').format('YYYY-MM-DD'));
            }}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            Reporte Trimestral
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default ClientReport;

