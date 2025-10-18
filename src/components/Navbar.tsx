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
        <Link href={"/"} className="w-full flex items-center justify-center" prefetch={false}>
          <div
            className={`h-[28px] w-[28px] transition-all flex items-center justify-center rounded-md ${path == "/"
                ? "border-accent bg-accent text-black"
                : "border-white bg-none text-white"
              } border-2`}
          >
            <p className="text-xs font-semibold">{new Date().getDate()}</p>
          </div>
        </Link>
        {/*files icon */}
        <Link href={"/files"} className="w-full flex items-center justify-center" prefetch={false}>
          {path.startsWith("/files") ? (
            <Image src={fileIconFilled} alt="file" className="w-auto h-auto" width={30} height={30} />
          ) : (
            <Image src={fileIcon} alt="file" className="w-auto h-auto" width={30} height={30} />
          )}
        </Link>
        {/*social icon */}
        <Link href={"/social"} className="w-full flex items-center justify-center" prefetch={false}>
          {path.startsWith("/social") ? (
            <Star fill="var(--primary)" className="text-primary" size={32} />
          ) : (
            <Star size={32} />
          )}
        </Link>
        {/*register icon */}
        <Link href={"/register"} className="w-full flex items-center justify-center" prefetch={false}>
          {path.startsWith("/register") ? (
            <Image src={registerIconFilled} alt="file" className="w-auto h-auto" width={25} height={29} />
          ) : (
            <Image src={registerIcon} alt="file" className="w-auto h-auto" width={25} height={29} />
          )}
        </Link>
        {/*profile icon */}
        <Link href={"/profile"} className="w-full flex items-center justify-center" prefetch={false}>
          {path == "/profile" ? (
            <Image src={profileIconFilled} alt="file" className="w-auto h-auto" width={28} height={28} />
          ) : (
            <Image src={profileIcon} alt="file" className="w-auto h-auto" width={28} height={28} />
          )}
        </Link>
      </div>
    </div>
  );
}
