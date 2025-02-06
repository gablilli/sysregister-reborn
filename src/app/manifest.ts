import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SysRegister',
        short_name: 'SysRegister',
        description: 'Alternative client for the classeviva interface',
        start_url: '/',
        display: 'standalone',
        background_color: '#130909',
        theme_color: '#280F0F',
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icons/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
        screenshots: [
            {
                src: '/icons/1.png',
                sizes: '387x847',
                type: 'image/png',
            },
            {
                src: '/icons/2.png',
                sizes: '387x847',
                type: 'image/png',
            },
        ],
    }
}