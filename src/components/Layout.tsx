import React, { ReactNode } from "react";
import Header from "./Header";

type StandardComponentProps = {
  children: ReactNode;
};

export default function Layout({ children } : StandardComponentProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
