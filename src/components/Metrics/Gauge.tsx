export default function Gauge({
  value,
  size = 128,
  label,
}: {
  value: number;
  label?: string;
  size?: number;
}) {
  const fontSize = size * 0.18;
  const borderSize = size * 0.15;

  return (
    <div
      className="rounded-full flex items-center justify-center relative overflow-hidden shadow-md"
      style={{ width: size, height: size }}
    >
      <div
        className="border-neutral-400 absolute top-0 bottom-0 left-0 right-0 rounded-full"
        style={{ width: size, height: size, borderWidth: borderSize }}
      ></div>
      <div
        className={`rounded-full absolute top-0 bottom-0 left-0 right-0 ${
          isNaN(value) || value === 0
            ? "border-gray-600"
            : value <= 5.5
            ? "border-red-600"
            : value <= 6.0
            ? "border-yellow-600"
            : "border-green-600"
        }`}
        style={{ width: size, height: size, borderWidth: borderSize }}
      ></div>
      <div className="flex flex-col items-center">
        <span className="font-semibold" style={{ fontSize }}>
          {isNaN(value) ? 0 : value}
          <span
            className="text-sm font-normal"
            style={{ fontSize: fontSize * 0.4 }}
          >
            /10
          </span>
        </span>
        {label && (
          <span style={{ fontSize: fontSize * 0.4 }} className="opacity-70">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
