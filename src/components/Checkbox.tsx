import { Check } from "lucide-react";

export default function Checkbox({
  checked,
  onChange,
}: Readonly<{ checked: boolean; onChange: () => void }>) {
  return (
    <div
      onClick={() => onChange()}
      className={`rounded-full opacity-50 transition-all border-2 h-[30px] w-[30px] flex items-center ${
        checked ? "bg-accent" : "bg-transparent"
      } justify-center border-accent`}
    >
      {checked && (
        <Check className={`translate-y-[1px] text-secondary`} size={18} />
      )}
    </div>
  );
}
