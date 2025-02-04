"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import fileIcon from "@/assets/icons/file.svg";
import fileIconFilled from "@/assets/icons/fileFilled.svg";
import registerIcon from "@/assets/icons/register.svg";
import registerIconFilled from "@/assets/icons/registerFilled.svg";
import profileIcon from "@/assets/icons/profile.svg";
import profileIconFilled from "@/assets/icons/profileFilled.svg";
import Image from "next/image";

export default function Navbar() {
  const path = usePathname();
  return (
    <div className="dark:bg-black z-50 bg-white fixed bottom-0 left-0 right-0 h-[80px] shadow-lg shadow-accent">
      <div className="flex items-center pt-4 justify-around">
        {/*today icon*/}
        <Link href={"/"}>
          <div
            className={`h-[28px] w-[28px] transition-all flex items-center justify-center rounded-md ${
              path == "/"
                ? "border-accent bg-accent text-black"
                : "border-white bg-none text-white"
            } border-2`}
          >
            <p className="text-xs font-semibold">{new Date().getDate()}</p>
          </div>
        </Link>
        {/*files icon */}
        <Link href={"/files"}>
          {path.startsWith("/files") ? (
            <Image src={fileIconFilled} alt="file" width={30} height={30} />
          ) : (
            <Image src={fileIcon} alt="file" width={30} height={30} />
          )}
        </Link>
        {/*register icon */}
        <Link href={"/register"}>
          {path.startsWith("/register") ? (
            <Image src={registerIconFilled} alt="file" width={25} height={29} />
          ) : (
            <Image src={registerIcon} alt="file" width={25} height={29} />
          )}
        </Link>
        {/*profile icon */}
        <Link href={"/profile"}>
          {path.startsWith("/profile") ? (
            <Image src={profileIconFilled} alt="file" width={28} height={28} />
          ) : (
            <Image src={profileIcon} alt="file" width={28} height={28} />
          )}
        </Link>
      </div>
    </div>
  );
}
