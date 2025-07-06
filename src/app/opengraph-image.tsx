import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Movie Watchlist - Track Your Favorite Movies'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 30,
              fontSize: 60,
            }}
          >
            🎬
          </div>
          <div style={{ fontSize: 72, fontWeight: 'bold' }}>
            Movie Watchlist
          </div>
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          Track your favorite movies and schedule when to watch them
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}