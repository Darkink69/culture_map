interface Props {
  onClick: () => void;
  active: boolean;
}

export default function SearchButton({ onClick, active }: Props) {
  return (
    <button
      onClick={onClick}
      className={
        "absolute bottom-6 left-6 z-1000 shadow-lg rounded-full w-12 h-12 flex items-center justify-center transition " +
        (active ? "bg-black hover:bg-[#6b7c94]" : "bg-white hover:bg-gray-50")
      }
      title="Поиск событий"
      aria-label="Поиск событий"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "white" : "#6b7c94"}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    </button>
  );
}
