import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GlobeAltIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { domainsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { RecordTypeBadge } from '../components/RecordTypes';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await domainsAPI.getStats();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Domains',
      value: stats?.totalDomains || 0,
      icon: GlobeAltIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Records',
      value: stats?.totalRecords || 0,
      icon: DocumentDuplicateIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Record Types',
      value: Object.keys(stats?.recordsByType || {}).length,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your DNS management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Records by Type */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Records by Type</h2>
          {Object.keys(stats?.recordsByType || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.recordsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <RecordTypeBadge type={type} />
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${(count / stats.totalRecords) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No records yet</p>
          )}
        </div>

        {/* Recent Domains */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Domains</h2>
            <Link to="/domains" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {stats?.recentDomains?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentDomains.map((domain) => (
                <Link
                  key={domain.id}
                  to={`/domains/${domain.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{domain.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        <span>{domain.recordCount} records</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDistanceToNow(new Date(domain.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GlobeAltIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No domains yet</p>
              <Link to="/domains" className="btn btn-primary mt-4 inline-block">
                Add Domain
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/domains"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <GlobeAltIcon className="h-8 w-8 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">Add Domain</p>
              <p className="text-sm text-gray-500">Create new zone</p>
            </div>
          </Link>
          <Link
            to="/domains"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <DocumentDuplicateIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Manage Records</p>
              <p className="text-sm text-gray-500">Add or edit DNS records</p>
            </div>
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-500">Domain statistics</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
