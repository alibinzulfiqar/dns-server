import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
}) {
  const typeStyles = {
    danger: 'btn-danger',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    primary: 'btn-primary',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary">
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`btn ${typeStyles[type]}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
