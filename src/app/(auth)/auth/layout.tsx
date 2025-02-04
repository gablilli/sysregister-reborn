import { Inter } from "next/font/google";
import "../../globals.css";

const inter = Inter({ subsets: ['latin'], display: 'swap', adjustFontFallback: false })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-background text-text`}
      >
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
