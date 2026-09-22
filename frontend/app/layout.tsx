import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";

export const metadata = {
  title: "Inventory-IT | Ensemble Scolaire JEAN 23",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased relative">
        <div className="slideshow-container">
          <div className="slide bg-1"></div>
          <div className="slide bg-2"></div>
          <div className="slide bg-3"></div>
          <div className="slide bg-4"></div>
          <div className="slide bg-5"></div>
        </div>

        <div className="content-overlay flex flex-col min-h-screen">
          <LayoutWrapper>{children}</LayoutWrapper>
        </div>
      </body>
    </html>
  );
}