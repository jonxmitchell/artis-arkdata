"use client";

import { React } from "react";
import { NextUIProvider } from "@nextui-org/react";
import "@/styles/globals.css";
import { useContextMenu } from "@/hooks/useContextMenu";

export default function RootLayout({ children }) {
  useContextMenu();

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <NextUIProvider>{children}</NextUIProvider>
      </body>
    </html>
  );
}
