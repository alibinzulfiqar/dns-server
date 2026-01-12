import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { domainsAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchDomains();
  }, [pagination.page, search]);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const response = await domainsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      setDomains(response.data.data.domains);
      setPagination((prev) => ({
        ...prev,
        ...response.data.data.pagination,
      }));
    } catch (error) {
      toast.error('Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (data) => {
    setSubmitting(true);
    try {
      await domainsAPI.create(data);
      toast.success('Domain created successfully');
      setIsAddModalOpen(false);
      reset();
      fetchDomains();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create domain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!deleteTarget) return;
    try {
      await domainsAPI.delete(deleteTarget.id);
      toast.success('Domain deleted successfully');
      fetchDomains();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete domain');
    }
    setDeleteTarget(null);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domains</h1>
          <p className="text-gray-600 mt-1">Manage your DNS zones</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Domain
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search domains..."
          value={search}
          onChange={handleSearchChange}
          className="input pl-10"
        />
      </div>

      {/* Domains List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : domains.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {domains.map((domain) => (
                    <tr key={domain.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/domains/${domain.id}`}
                          className="flex items-center gap-3 text-gray-900 hover:text-primary-600"
                        >
                          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{domain.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-600">
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          <span>{domain.recordCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {domain.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(domain.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setDeleteTarget(domain)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete domain"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> domains
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary flex items-center gap-1 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn btn-secondary flex items-center gap-1 disabled:opacity-50"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <GlobeAltIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first domain</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              Add Domain
            </button>
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          reset();
        }}
        title="Add Domain"
      >
        <form onSubmit={handleSubmit(handleCreateDomain)} className="space-y-4">
          <div>
            <label className="label">Domain Name</label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="example.com"
              {...register('name', {
                required: 'Domain name is required',
                pattern: {
                  value: /^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/,
                  message: 'Invalid domain name format',
                },
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Type</label>
            <select className="input" {...register('type')}>
              <option value="NATIVE">Native</option>
              <option value="MASTER">Master</option>
              <option value="SLAVE">Slave</option>
            </select>
          </div>

          <div>
            <label className="label">Default TTL (seconds)</label>
            <input
              type="number"
              className={`input ${errors.defaultTtl ? 'border-red-500' : ''}`}
              defaultValue={3600}
              {...register('defaultTtl', {
                valueAsNumber: true,
                min: { value: 60, message: 'TTL must be at least 60 seconds' },
                max: { value: 86400, message: 'TTL must be at most 86400 seconds' },
              })}
            />
            {errors.defaultTtl && (
              <p className="text-red-500 text-sm mt-1">{errors.defaultTtl.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                reset();
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Creating...' : 'Create Domain'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDomain}
        title="Delete Domain"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all associated DNS records. This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
