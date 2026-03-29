export default function PrepEasyLogo({
  subtitle,
  textClassName = "text-slate-900",
  subtextClassName = "text-slate-500",
  compact = false,
}) {
  const isMono = textClassName.includes("text-white");

  return (
    <div className="flex items-center gap-3">
      <img
        src="/prepeasy-logo.svg"
        alt="PrepEasy logo"
        className={compact ? "h-12 w-12 rounded-2xl" : "h-16 w-16 rounded-[22px]"}
      />
      <div>
        <div className={`text-2xl font-black tracking-tight ${textClassName}`}>
          {isMono ? (
            "PrepEasy"
          ) : (
            <>
              <span className="text-[#2F80ED]">Prep</span>
              <span className="text-[#18B7B0]">Easy</span>
            </>
          )}
        </div>
        {subtitle ? (
          <div className={`mt-0.5 text-sm ${subtextClassName}`}>{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
