import Image from "next/image";

export function SignSealLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "flex h-11 w-11 items-center justify-center rounded-lg bg-white p-1.5" : "flex h-14 items-center rounded-lg bg-white px-3 py-2"}>
      <Image
        src="/signseal-logo.png"
        alt="SignSeal logo"
        width={compact ? 44 : 220}
        height={compact ? 44 : 58}
        className="h-full w-full object-contain object-left"
        priority
      />
    </span>
  );
}