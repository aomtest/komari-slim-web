export function UpDownStack({
  up,
  down,
  className,
}: {
  up: string;
  down: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      <label className="text-base font-bold">{up}</label>
      <label className="text-sm text-muted-foreground -mt-1">{down}</label>
    </div>
  );
}