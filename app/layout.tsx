import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Fantasy UK Cabinet",
  description: "Pick 10 Labour MPs for £100. Score points if they're in cabinet on 1 July 2026.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <footer className="border-t-[10px] border-[#1d70b8] mt-12 bg-[#f3f2f1]">
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 text-sm text-[#0b0c0c]">
            <p className="mb-2">
              Fantasy UK Cabinet — a hobby fantasy game. Not affiliated with HM Government, the Labour Party, or the UK Parliament.
            </p>
            <p className="text-[#505a5f]">
              MP data from the UK Parliament Members API, used under the{" "}
              <a href="https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/" target="_blank" rel="noopener noreferrer">
                Open Parliament Licence
              </a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
