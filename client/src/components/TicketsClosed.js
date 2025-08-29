import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';

const TicketsClosed = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchClosedTickets();
  }, [period]);

  const fetchClosedTickets = async () => {
    try {
      setLoading(true);
      
      // Usar el sistema automático del backend - no enviar fechas
      const response = await axios.get('/api/tickets/closed', {
        params: { period }
      });
      
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching closed tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.technicianName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'medium':
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResolutionTimeColor = (hours) => {
    if (hours <= 4) return 'text-green-600';
    if (hours <= 24) return 'text-yellow-600';
    return 'text-red-600';
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Tickets Cerrados</h1>
        <p className="text-gray-600 mt-2">
          Historial de tickets resueltos del {period === 'week' ? 'última semana' : 'último mes'}
        </p>
      </div>

      {/* Controls */}
      <div className="dashboard-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los Estados</option>
              <option value="Closed">Cerrado</option>
              <option value="Resolved">Resuelto</option>
              <option value="Cancelled">Cancelado</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las Prioridades</option>
              <option value="High">Alta</option>
              <option value="Medium">Media</option>
              <option value="Low">Baja</option>
            </select>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mes</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="btn-primary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ticket</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Técnico</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Prioridad</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha Cierre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tiempo Resolución</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No se encontraron tickets cerrados
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{ticket.title}</p>
                        <p className="text-sm text-gray-500">#{ticket.id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{ticket.clientName}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-700">{ticket.technicianName || 'Sin asignar'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {moment(ticket.completedDate).format('DD/MM/YYYY')}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${getResolutionTimeColor(ticket.resolutionTime)}`}>
                        {ticket.resolutionTime ? `${ticket.resolutionTime}h` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Clock className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total de tickets: {filteredTickets.length}</span>
            <span>Mostrando {filteredTickets.length} de {tickets.length} tickets</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsClosed;
