import Image from "next/image";

export function SignSealLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={
        compact
          ? "flex h-11 w-11 overflow-hidden"
          : "flex h-16 w-64 max-w-full overflow-hidden"
      }
    >
      <Image
        src="/signseal-main-logo.svg"
        alt="SignSeal logo"
        width={1087}
        height={290}
        className={
          compact
            ? "h-full w-[10.5rem] max-w-none object-cover object-left"
            : "h-full w-full object-contain object-left"
        }
        priority
      />
    </span>
  );
}