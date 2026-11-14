import { ImageResponse } from 'next/og';
export const alt = 'VibeDecode: make sense of what you built. Architecture, source explanations and coding practice.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', background: '#eef3fc', padding: 70, flexDirection: 'column', color: '#203c78', fontFamily: 'sans-serif' }}><div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>VibeDecode.</div><div style={{ display: 'flex', fontSize: 78, lineHeight: 1.1, fontWeight: 700, marginTop: 65, maxWidth: 950 }}>Make sense of what you built.</div><div style={{ display: 'flex', fontSize: 28, marginTop: 35, color: '#53647d' }}>Explore the architecture. Follow the source. Practice the ideas.</div><div style={{ display: 'flex', marginTop: 'auto', fontSize: 24, background: '#3559df', color: 'white', padding: '18px 28px', borderRadius: 12, alignSelf: 'flex-start' }}>Try the practice demo</div></div>, size);
}
