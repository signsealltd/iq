import Image from "next/image";

export function SignSealLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={
        compact
          ? "flex h-11 w-11 overflow-hidden"
          : "flex h-14 w-56 overflow-hidden"
      }
    >
      <Image
        src="/signseal-logo-transparent.png"
        alt="SignSeal logo"
        width={compact ? 160 : 640}
        height={compact ? 160 : 170}
        className={
          compact
            ? "h-full w-[10rem] max-w-none object-cover object-left"
            : "h-full w-full object-contain object-left"
        }
        priority
      />
    </span>
  );
}