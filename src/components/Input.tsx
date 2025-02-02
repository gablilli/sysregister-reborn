import * as React from "react";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="overflow-hidden relative rounded-xl">
        <div className="bg-secondary absolute -z-10 opacity-25 top-0 bottom-0 left-0 right-0"/>
        <input
          type={type}
          className={`${className} bg-transparent placeholder:text-accent placeholder:opacity-35 outline-primary bg-opacity-45 rounded-xl py-3 px-3 w-full focus:outline-2`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

const InputLabel = ({ text }: { text: string }) => {
  return <p className="pb-1 font-semibold text-md text-accent">{text}</p>;
};

export { InputLabel, Input };
