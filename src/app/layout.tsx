import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Voice of You | A better Karnataka starts with you', description: 'An independent citizen platform to report civic issues, follow progress, and build a better Karnataka. Available in English, Kannada and Hindi.', icons: { icon: '/logo.png' } };
export const viewport: Viewport = { themeColor: '#faf5ea', width: 'device-width', initialScale: 1 };
const fonts = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Serif+Kannada:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;500;600&display=swap';
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="stylesheet" href={fonts}/></head><body>{children}</body></html>;
}
