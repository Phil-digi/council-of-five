import React from 'react';

// Adrien — Le Rationaliste : cerveau géométrique stylisé
export const AdrienIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#3b82f6' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Crane stylisé */}
        <path d="M32 6C18.7 6 8 16.7 8 30c0 8.3 4.2 15.6 10.5 20l2.5 4h22l2.5-4C51.8 45.6 56 38.3 56 30 56 16.7 45.3 6 32 6z"
            fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
        {/* Circuit neural */}
        <circle cx="24" cy="26" r="3" fill={color} />
        <circle cx="40" cy="26" r="3" fill={color} />
        <circle cx="32" cy="34" r="3" fill={color} />
        <circle cx="26" cy="42" r="2" fill={color} opacity="0.6" />
        <circle cx="38" cy="42" r="2" fill={color} opacity="0.6" />
        <line x1="24" y1="26" x2="32" y2="34" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="40" y1="26" x2="32" y2="34" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="24" y1="26" x2="40" y2="26" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="32" y1="34" x2="26" y2="42" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="32" y1="34" x2="38" y2="42" stroke={color} strokeWidth="1.5" opacity="0.5" />
        {/* Éclat de pensée */}
        <path d="M32 10l1 4-1 0-1-4z" fill={color} opacity="0.4" />
        <path d="M16 18l3 2.5-1 1-3-2.5z" fill={color} opacity="0.4" />
        <path d="M48 18l-3 2.5 1 1 3-2.5z" fill={color} opacity="0.4" />
    </svg>
);

// Nova — La Visionnaire : étoile filante / constellation
export const NovaIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#ec4899' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Halo lumineux */}
        <circle cx="32" cy="28" r="18" fill={color} opacity="0.08" />
        {/* Étoile principale */}
        <path d="M32 8l4 12h12l-10 7 4 13-10-8-10 8 4-13-10-7h12z"
            fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
        {/* Centre brillant */}
        <circle cx="32" cy="28" r="5" fill={color} opacity="0.6" />
        <circle cx="32" cy="28" r="2" fill="white" opacity="0.9" />
        {/* Traînée d'étoile filante */}
        <path d="M36 36c4 4 10 8 18 10" stroke={color} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        <circle cx="48" cy="44" r="1.5" fill={color} opacity="0.5" />
        <circle cx="52" cy="46" r="1" fill={color} opacity="0.3" />
        <circle cx="55" cy="47" r="0.7" fill={color} opacity="0.2" />
        {/* Petites étoiles */}
        <path d="M14 44l1 2 2-1-2 1 1 2-1-2-2 1 2-1z" fill={color} opacity="0.4" />
        <path d="M20 52l1 2 2-1-2 1 1 2-1-2-2 1 2-1z" fill={color} opacity="0.3" />
    </svg>
);

// Henri — Le Conservateur : bouclier héraldique stylisé
export const HenriIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#f59e0b' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bouclier */}
        <path d="M32 6L10 16v16c0 14 10 22 22 26 12-4 22-12 22-26V16L32 6z"
            fill={color} opacity="0.12" stroke={color} strokeWidth="2" />
        {/* Bordure intérieure */}
        <path d="M32 12l-16 7v12c0 10 7 17 16 20 9-3 16-10 16-20V19L32 12z"
            fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
        {/* Croix héraldique */}
        <rect x="29" y="20" width="6" height="24" rx="1" fill={color} opacity="0.5" />
        <rect x="20" y="29" width="24" height="6" rx="1" fill={color} opacity="0.5" />
        {/* Coins décoratifs */}
        <circle cx="22" cy="22" r="2" fill={color} opacity="0.3" />
        <circle cx="42" cy="22" r="2" fill={color} opacity="0.3" />
    </svg>
);

// Aya — Justice sociale : poing levé stylisé / balance
export const AyaIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#ef4444' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Flamme sociale */}
        <path d="M32 4c0 0-14 16-14 30 0 12 6 20 14 26 8-6 14-14 14-26C46 20 32 4 32 4z"
            fill={color} opacity="0.1" stroke={color} strokeWidth="1.5" />
        {/* Poing stylisé */}
        <path d="M26 30h12c2 0 3 1.5 3 3v4c0 2-1 3-3 3h-1v6c0 1-1 2-2 2h-6c-1 0-2-1-2-2v-6h-1c-2 0-3-1-3-3v-4c0-1.5 1-3 3-3z"
            fill={color} opacity="0.5" />
        {/* Doigts */}
        <rect x="27" y="24" width="3" height="8" rx="1.5" fill={color} opacity="0.6" />
        <rect x="31" y="22" width="3" height="10" rx="1.5" fill={color} opacity="0.7" />
        <rect x="35" y="24" width="3" height="8" rx="1.5" fill={color} opacity="0.6" />
        {/* Rayons d'énergie */}
        <line x1="32" y1="14" x2="32" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1="22" y1="20" x2="24" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="42" y1="20" x2="40" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="18" y1="28" x2="22" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="46" y1="28" x2="42" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
);

// Damien — Contrarien conspi-light : œil avec loupe / triangle
export const DamienIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#14b8a6' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Triangle de conspiration */}
        <path d="M32 8L8 52h48L32 8z" fill={color} opacity="0.08" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
        {/* Œil central */}
        <ellipse cx="32" cy="32" rx="14" ry="9" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5" />
        <circle cx="32" cy="32" r="6" fill={color} opacity="0.3" stroke={color} strokeWidth="1" />
        <circle cx="32" cy="32" r="3" fill={color} opacity="0.7" />
        <circle cx="33" cy="31" r="1" fill="white" opacity="0.8" />
        {/* Rayons de vigilance */}
        <line x1="32" y1="18" x2="32" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="44" y1="24" x2="42" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="20" y1="24" x2="22" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        {/* Points de connexion */}
        <circle cx="20" cy="48" r="2" fill={color} opacity="0.3" />
        <circle cx="44" cy="48" r="2" fill={color} opacity="0.3" />
        <line x1="20" y1="48" x2="32" y2="38" stroke={color} strokeWidth="0.8" opacity="0.2" />
        <line x1="44" y1="48" x2="32" y2="38" stroke={color} strokeWidth="0.8" opacity="0.2" />
    </svg>
);

// Map des icônes par persona
export const PERSONA_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
    Adrien: AdrienIcon,
    Nova: NovaIcon,
    Henri: HenriIcon,
    Aya: AyaIcon,
    Damien: DamienIcon
};
