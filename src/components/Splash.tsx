interface Props {
  visible: boolean;
  message?: string;
}

export default function Splash({ visible, message }: Props) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-3000 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 max-w-sm w-full mx-4 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Логотип"
          className="w-48 object-contain"
          onError={(e) => {
            // если лого нет — не показываем пустой квадрат
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="mt-4 text-sm text-gray-700 text-center">
          {message ?? "Подключение к GPS..."}
        </div>
        <div className="mt-4 flex gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
