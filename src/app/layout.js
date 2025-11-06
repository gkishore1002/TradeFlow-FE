import "./globals.css";

export const metadata = {
  title: "TradeFlow",
  description: "Premium minimalistic trading app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
