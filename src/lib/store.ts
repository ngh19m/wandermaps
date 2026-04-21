import { useState, useEffect } from 'react';
import type { MarkerInfo, Memory, UserProfile } from '../types';

const DEFAULT_MARKERS: MarkerInfo[] = [
  {
    id: 'm1',
    userId: 'me',
    lat: 21.0306,
    lng: 105.7895,
    address: 'Cầu Giấy, Hà Nội',
    title: 'Nhà Nam',
    category: 'Other',
    status: 'visited',
    tags: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    userId: 'me',
    lat: 21.0285,
    lng: 105.8048,
    address: 'Ba Đình, Hà Nội',
    title: 'The Deck',
    category: 'Ăn uống',
    status: 'want_to_go',
    tags: [],
    createdAt: new Date().toISOString()
  }
];

export function useStore() {
  const [markers, setMarkers] = useState<MarkerInfo[]>(() => {
    const saved = localStorage.getItem('wandermark_markers');
    return saved ? JSON.parse(saved) : DEFAULT_MARKERS;
  });

  const [memories, setMemories] = useState<Memory[]>(() => {
    const saved = localStorage.getItem('wandermark_memories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('wandermark_markers', JSON.stringify(markers));
  }, [markers]);

  useEffect(() => {
    localStorage.setItem('wandermark_memories', JSON.stringify(memories));
  }, [memories]);

  const addMarker = (marker: MarkerInfo) => {
    setMarkers(prev => [...prev, marker]);
  };

  const addMemory = (memory: Memory) => {
    setMemories(prev => [...prev, memory]);
  };

  return { markers, addMarker, memories, addMemory };
}
