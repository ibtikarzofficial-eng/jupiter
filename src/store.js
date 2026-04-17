// src/store.js
import { create } from 'zustand';

export const countriesData = [
    { id: 'USA', name: 'United States', lat: 37.09, lon: -95.71, flag: '🇺🇸', stat: '94% Approval Rate' },
    { id: 'UK', name: 'United Kingdom', lat: 55.37, lon: -3.43, flag: '🇬🇧', stat: 'Processing: 3–6 wks' },
    { id: 'UAE', name: 'United Arab Emirates', lat: 23.42, lon: 53.84, flag: '🇦🇪', stat: '0% Income Tax' },
    { id: 'AUS', name: 'Australia', lat: -25.27, lon: 133.77, flag: '🇦🇺', stat: 'High Skilled Visas' },
    { id: 'CAN', name: 'Canada', lat: 56.13, lon: -106.34, flag: '🇨🇦', stat: 'Express Entry: 6 mo' }
];

export const useScrollStore = create((set) => ({
    scrollProgress: 0,
    setScrollProgress: (progress) => set({ scrollProgress: progress }),
    hoveredCountry: null,
    setHoveredCountry: (id) => set({ hoveredCountry: id }),
    selectedCountry: null,
    setSelectedCountry: (id) => set({ selectedCountry: id })
}));