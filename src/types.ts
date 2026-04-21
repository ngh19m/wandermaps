export type MarkerStatus = 'visited' | 'want_to_go' | 'secret';

export interface Tag {
  id: string;
  name: string;
  category: 'Ăn uống' | 'Chill' | 'Work' | 'Other';
}

export interface MarkerInfo {
  id: string;
  userId: string;
  lat: number;
  lng: number;
  address: string;
  title: string;
  category: string;
  status: MarkerStatus;
  tags: Tag[];
  createdAt: string;
}

export interface Memory {
  id: string;
  markerId: string;
  photoUrls: string[];
  noteContent: string;
  emotionScore: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  preferences: string[];
  searchHistory: string[];
}
