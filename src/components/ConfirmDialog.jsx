import { useLanguage } from '../context/useLanguage';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  const { t } = useLanguage();

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-danger" onClick={onConfirm}>
            {t('yes')}
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            {t('no')}
          </button>
        </div>
      </div>
    </div>
  );
}
