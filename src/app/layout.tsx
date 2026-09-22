import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "बृजविहारी गौ तीर्थ धाम | 51,000 शिवलिंग निर्माण दान रजिस्टर",
  description: "51,000 शिवलिंग निर्माण संकल्प हेतु आधिकारिक दान प्रबंधन प्रणाली एवं दानदाता डिजिटल रजिस्टर - बृजविहारी गौ तीर्थ धाम।",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rozha+One&family=Tiro+Devanagari+Hindi:ital@0;1&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-stone-900 font-sans">
        {children}
      </body>
    </html>
  );
}
