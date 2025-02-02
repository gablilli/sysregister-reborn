import { Cog } from "lucide-react";

export default function Wip() {
  return (
    <div className="h-[calc(100svh-90px-104px)] px-4 flex flex-col items-center justify-center">
      <div className="flex ites-center">
        <Cog className="text-primary mb-4 animate-spin" size={100} />
        <Cog className="text-secondary mb-4 animate-spin delay-750" size={50} />
      </div>

      <p className="text-center text-text font-semibold">
        Questa sezione sta venendo ancora costruita!
      </p>
      <p className="text-sm text-text opacity-75 text-center">
        Sto lavorando il piu&apos; veloce possibile per finire il tutto!
      </p>
    </div>
  );
}
