import { useT } from '../i18n/index.js';

interface AboutDialogProps {
  version: string;
  onClose: () => void;
}

export function AboutDialog({ version, onClose }: AboutDialogProps) {
  const t = useT();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{'\u{1F528}'}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">DMAP Builder</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">v{version}</p>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6">
          <p>{t('about.description1')}</p>
          <p>{t('about.description2')}</p>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('about.footer')}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
