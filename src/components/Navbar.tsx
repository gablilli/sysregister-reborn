"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import fileIcon from "@/assets/icons/file.svg";
import fileIconFilled from "@/assets/icons/fileFilled.svg";
import registerIcon from "@/assets/icons/register.svg";
import registerIconFilled from "@/assets/icons/registerFilled.svg";
import profileIcon from "@/assets/icons/profile.svg";
import profileIconFilled from "@/assets/icons/profileFilled.svg";
import Image from "next/legacy/image";
import { Star } from "lucide-react";

export default function Navbar() {
  const path = usePathname();
  return (
    <div className="dark:bg-black z-50 bg-white fixed bottom-0 left-0 right-0 h-[80px] shadow-lg shadow-accent">
      <div className="flex items-center pt-4 justify-around">
        {/*today icon*/}
        <Link href={"/app"} className="w-full flex items-center justify-center" prefetch={false}>
          <div
            className={`h-[28px] w-[28px] transition-all flex items-center justify-center rounded-md ${path == "/app"
                ? "border-accent bg-accent text-black"
                : "border-white bg-none text-white"
              } border-2`}
          >
            <p className="text-xs font-semibold">{new Date().getDate()}</p>
          </div>
        </Link>
        {/*files icon */}
        <Link href={"/app/files"} className="w-full flex items-center justify-center" prefetch={false}>
          {path.startsWith("/app/files") ? (
            <Image src={fileIconFilled} alt="file" className="w-auto h-auto" width={30} height={30} />
          ) : (
            <Image src={fileIcon} alt="file" className="w-auto h-auto" width={30} height={30} />
          )}
        </Link>
        {/*social icon */}
        <Link href={"/app/social"} className="w-full flex items-center justify-center" prefetch={false}>
          {path.startsWith("/app/social") ? (
            <Star fill="var(--primary)" className="text-primary" size={32} />
          ) : (
            <Star size={32} />
          )}
        </Link>
        {/*register icon */}
        <Link href={"/app/register"} className="w-full flex items-center justify-center" prefetch={false}>
          {path.startsWith("/app/register") ? (
            <Image src={registerIconFilled} alt="file" className="w-auto h-auto" width={25} height={29} />
          ) : (
            <Image src={registerIcon} alt="file" className="w-auto h-auto" width={25} height={29} />
          )}
        </Link>
        {/*profile icon */}
        <Link href={"/app/profile"} className="w-full flex items-center justify-center" prefetch={false}>
          {path == "/app/profile" ? (
            <Image src={profileIconFilled} alt="file" className="w-auto h-auto" width={28} height={28} />
          ) : (
            <Image src={profileIcon} alt="file" className="w-auto h-auto" width={28} height={28} />
          )}
        </Link>
      </div>
    </div>
  );
}
