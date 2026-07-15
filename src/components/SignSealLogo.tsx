import Image from "next/image";

export function SignSealLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "flex h-11 w-11 items-center justify-center" : "flex h-12 items-center"}>
      <Image
        src="/signseal-logo.svg"
        alt="SignSeal logo"
        width={compact ? 44 : 220}
        height={compact ? 44 : 58}
        className="h-full w-full object-contain object-left"
        priority
      />
    </span>
  );
}