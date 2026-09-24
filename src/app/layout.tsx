import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dein Dreh. Dein Thüringen. | Glücksrad",
  description: "Drehen, stoppen und Thüringer Glücksmomente entdecken.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
