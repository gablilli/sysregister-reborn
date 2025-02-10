import { Inter } from "next/font/google";
import "../../globals.css";
import { Suspense } from "react";

const inter = Inter({ subsets: ['latin'], display: 'swap', adjustFontFallback: false })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <body
        className={`${inter.className} antialiased dark bg-background text-text`}
      >
        <Suspense>
          <div className="max-w-lg mx-auto">
            {children}
          </div>
        </Suspense>
      </body>
    </html>
  );
}
