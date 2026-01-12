import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { domainsAPI, recordsAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { RecordTypeBadge, RecordTypeSelect } from '../components/RecordTypes';
import { formatDistanceToNow } from 'date-fns';

export default function DomainDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [domain, setDomain] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const recordForm = useForm();
  const settingsForm = useForm();

  useEffect(() => {
    fetchDomain();
  }, [id]);

  useEffect(() => {
    if (domain) {
      settingsForm.reset({
        soaPrimary: domain.soaPrimary,
        soaEmail: domain.soaEmail,
        soaRefresh: domain.soaRefresh,
        soaRetry: domain.soaRetry,
        soaExpire: domain.soaExpire,
        soaTtl: domain.soaTtl,
        defaultTtl: domain.defaultTtl,
      });
    }
  }, [domain]);

  const fetchDomain = async () => {
    setLoading(true);
    try {
      const response = await domainsAPI.getOne(id);
      setDomain(response.data.data.domain);
      setRecords(response.data.data.domain.records || []);
    } catch (error) {
      toast.error('Failed to fetch domain');
      navigate('/domains');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (data) => {
    setSubmitting(true);
    try {
      await recordsAPI.create(id, data);
      toast.success('Record created successfully');
      setIsRecordModalOpen(false);
      recordForm.reset();
      fetchDomain();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRecord = async (data) => {
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      await recordsAPI.update(id, editingRecord.id, data);
      toast.success('Record updated successfully');
      setEditingRecord(null);
      recordForm.reset();
      fetchDomain();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    try {
      await recordsAPI.delete(id, deleteTarget.id);
      toast.success('Record deleted successfully');
      fetchDomain();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    }
    setDeleteTarget(null);
  };

  const handleUpdateSettings = async (data) => {
    setSubmitting(true);
    try {
      await domainsAPI.update(id, data);
      toast.success('Settings updated successfully');
      setIsSettingsModalOpen(false);
      fetchDomain();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditRecord = (record) => {
    const namePart = record.name.replace(`.${domain.name}`, '').replace(domain.name, '@');
    recordForm.reset({
      name: namePart === '' ? '@' : namePart,
      type: record.type,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
    });
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const openAddRecord = () => {
    recordForm.reset({
      name: '@',
      type: 'A',
      content: '',
      ttl: domain?.defaultTtl || 3600,
      priority: null,
    });
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };

  const filteredRecords = filterType
    ? records.filter((r) => r.type === filterType)
    : records;

  const recordTypes = [...new Set(records.map((r) => r.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!domain) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/domains"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{domain.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <DocumentDuplicateIcon className="h-4 w-4" />
                {records.length} records
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Updated {formatDistanceToNow(new Date(domain.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            Settings
          </button>
          <button
            onClick={openAddRecord}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Record
          </button>
        </div>
      </div>

      {/* SOA Info Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SOA Record</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Primary NS</p>
            <p className="font-medium">{domain.soaPrimary}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{domain.soaEmail}</p>
          </div>
          <div>
            <p className="text-gray-500">Serial</p>
            <p className="font-medium">{domain.soaSerial}</p>
          </div>
          <div>
            <p className="text-gray-500">Default TTL</p>
            <p className="font-medium">{domain.defaultTtl}s</p>
          </div>
        </div>
      </div>

      {/* Records Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filterType === ''
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({records.length})
        </button>
        {recordTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === type
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type} ({records.filter((r) => r.type === type).length})
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TTL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{record.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RecordTypeBadge type={record.type} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm break-all">{record.content}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.ttl}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.priority !== null ? record.priority : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditRecord(record)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit record"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(record)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <DocumentDuplicateIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records</h3>
            <p className="text-gray-500 mb-6">
              {filterType ? 'No records match this filter' : 'Add your first DNS record'}
            </p>
            {!filterType && (
              <button onClick={openAddRecord} className="btn btn-primary">
                Add Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Record Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
          recordForm.reset();
        }}
        title={editingRecord ? 'Edit Record' : 'Add Record'}
      >
        <form
          onSubmit={recordForm.handleSubmit(editingRecord ? handleUpdateRecord : handleCreateRecord)}
          className="space-y-4"
        >
          <div>
            <label className="label">Name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className={`input flex-1 ${recordForm.formState.errors.name ? 'border-red-500' : ''}`}
                placeholder="@ or subdomain"
                {...recordForm.register('name', { required: 'Name is required' })}
              />
              <span className="text-gray-500">.{domain.name}</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Use @ for root domain</p>
            {recordForm.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{recordForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Type</label>
            <RecordTypeSelect
              value={recordForm.watch('type')}
              onChange={(value) => recordForm.setValue('type', value)}
              className={recordForm.formState.errors.type ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <label className="label">Content</label>
            <input
              type="text"
              className={`input ${recordForm.formState.errors.content ? 'border-red-500' : ''}`}
              placeholder={
                recordForm.watch('type') === 'A'
                  ? '192.168.1.1'
                  : recordForm.watch('type') === 'MX'
                  ? 'mail.example.com'
                  : 'Value'
              }
              {...recordForm.register('content', { required: 'Content is required' })}
            />
            {recordForm.formState.errors.content && (
              <p className="text-red-500 text-sm mt-1">{recordForm.formState.errors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">TTL (seconds)</label>
              <input
                type="number"
                className="input"
                {...recordForm.register('ttl', { valueAsNumber: true })}
              />
            </div>
            {['MX', 'SRV'].includes(recordForm.watch('type')) && (
              <div>
                <label className="label">Priority</label>
                <input
                  type="number"
                  className="input"
                  {...recordForm.register('priority', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsRecordModalOpen(false);
                setEditingRecord(null);
                recordForm.reset();
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Domain Settings"
        size="lg"
      >
        <form onSubmit={settingsForm.handleSubmit(handleUpdateSettings)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Nameserver</label>
              <input
                type="text"
                className="input"
                {...settingsForm.register('soaPrimary')}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="text"
                className="input"
                {...settingsForm.register('soaEmail')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Refresh (s)</label>
              <input
                type="number"
                className="input"
                {...settingsForm.register('soaRefresh', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="label">Retry (s)</label>
              <input
                type="number"
                className="input"
                {...settingsForm.register('soaRetry', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="label">Expire (s)</label>
              <input
                type="number"
                className="input"
                {...settingsForm.register('soaExpire', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="label">TTL (s)</label>
              <input
                type="number"
                className="input"
                {...settingsForm.register('soaTtl', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div>
            <label className="label">Default TTL for new records (s)</label>
            <input
              type="number"
              className="input"
              {...settingsForm.register('defaultTtl', { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Record Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Record"
        message={`Are you sure you want to delete this ${deleteTarget?.type} record for "${deleteTarget?.name}"?`}
        confirmText="Delete"
      />
    </div>
  );
}
