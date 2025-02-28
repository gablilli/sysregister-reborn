export default function Line({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-start overflow-hidden flex-col ph-no-capture">
      <p className="font-semibold mb-0.5 ph-censor-text">{label}</p>
      <div className="relative w-full rounded-sm overflow-hidden">
        <div className="absolute top-0 bottom-0 right-0 left-0 -z-10 bg-secondary opacity-30"/>
        <div
          className={`asbolute block text-right top-0 bottom-0 left-0 ${
            value <= 5.5
              ? "bg-red-600"
              : value < 6.0
              ? "bg-yellow-600"
              : "bg-green-600"
          }`}
          style={{ width: `${(isNaN(value) ? 0 : value) * 10}%` }}
        >
          <span className="font-semibold ph-censor-text mr-1.5 ml-1.5">
            {isNaN(value) ? 0 : value}
            <span className="text-xs font-normal">/10</span>
          </span>
        </div>
      </div>
    </div>
  );
}
