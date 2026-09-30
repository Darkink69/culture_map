interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HintPopup({ visible, onClose }: Props) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-2500 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Не удалось определить местоположение
        </h2>
        <p className="text-sm text-gray-700 mb-4">
          Не удалось определить ваше местоположение по GPS. Нажмите на карте на
          интересующий вас город.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
