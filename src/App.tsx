import React, { useState, useRef } from 'react';
import { MapView } from './components/MapView';
import { useStore } from './lib/store';
import { askAssistant } from './lib/geminiApi';
import { Bot, Plus, Navigation, MapPin, Phone, MessageSquare, ArrowRight, X, List, Sparkles, Camera, Star, BookOpen, Clock, Image as ImageIcon } from 'lucide-react';
import { MarkerInfo, MarkerStatus } from './types';

export default function App() {
  const { markers, addMarker, memories, addMemory } = useStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, actions?: any[]}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  
  const [isMarking, setIsMarking] = useState(false);
  const [markerFormOpen, setMarkerFormOpen] = useState(false);
  const [perspectiveOpen, setPerspectiveOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState<{lat: number, lng: number} | null>(null);
  const [newMarkerTitle, setNewMarkerTitle] = useState('');
  const [newMarkerAddress, setNewMarkerAddress] = useState('');
  const [newMarkerCategory, setNewMarkerCategory] = useState<'Ăn uống' | 'Chill' | 'Work' | 'Other'>('Other');
  const [newMarkerStatus, setNewMarkerStatus] = useState<MarkerStatus>('want_to_go');

  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null);
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [newMemoryScore, setNewMemoryScore] = useState(5);
  const [newMemoryPhotos, setNewMemoryPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app we'd upload the File object to Firebase Storage/S3.
    // Here we'll just simulate by generating a random picsum URL to represent the uploaded image.
    if (e.target.files && e.target.files.length > 0) {
      const keyword = selectedMarker?.category === 'Ăn uống' ? 'food' : 'nature';
      const url = `https://picsum.photos/seed/${Math.random().toString(36)}/800/600`;
      setNewMemoryPhotos(prev => [...prev, url]);
    }
  };

  const handleSaveMemory = () => {
    if (!selectedMarker) return;
    if (!newMemoryNote.trim() && newMemoryPhotos.length === 0) return;
    
    addMemory({
      id: Math.random().toString(36).substring(7),
      markerId: selectedMarker.id,
      noteContent: newMemoryNote,
      emotionScore: newMemoryScore,
      photoUrls: newMemoryPhotos,
      createdAt: new Date().toISOString()
    });
    
    setNewMemoryNote('');
    setNewMemoryScore(5);
    setNewMemoryPhotos([]);
  };

  const handleAIQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userQ = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setIsTyping(true);

    try {
      const result = await askAssistant(userQ, messages, markers, memories);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: result.answer || "I couldn't process that.",
        actions: result.actionCards 
      }]);
      
      // Auto center map on the first action card if available
      if (result.actionCards && result.actionCards.length > 0) {
        setMapCenter([result.actionCards[0].lat, result.actionCards[0].lng]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "An error occurred connecting to my brain." }]);
    }
    
    setIsTyping(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isMarking) {
      setTempLocation({ lat, lng });
      setMarkerFormOpen(true);
      setIsMarking(false);
    }
  };

  const handleSaveMarker = () => {
    if (!tempLocation) return;
    const newMarker: MarkerInfo = {
      id: Math.random().toString(36).substring(7),
      userId: 'me',
      lat: tempLocation.lat,
      lng: tempLocation.lng,
      address: newMarkerAddress || 'Dropped Pin',
      title: newMarkerTitle || 'New Place',
      category: newMarkerCategory,
      status: newMarkerStatus,
      tags: [],
      createdAt: new Date().toISOString()
    };
    addMarker(newMarker);
    setMarkerFormOpen(false);
    setTempLocation(null);
    setNewMarkerTitle('');
    setNewMarkerAddress('');
    setNewMarkerCategory('Other');
    setNewMarkerStatus('want_to_go');
    setMapCenter([tempLocation.lat, tempLocation.lng]);
  };

  const requestCurrentLocationAndMark = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTempLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMarkerFormOpen(true);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Couldn't get your location. Please tap on the map instead.");
          setIsMarking(true);
        }
      );
    } else {
      setIsMarking(true);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gray-50 font-sans">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapView 
          markers={markers} 
          onLocationSelect={handleMapClick}
          onMarkerClick={setSelectedMarker}
          center={mapCenter}
        />
      </div>

      {/* Top Bar - Glassmorphism Pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center p-1.5 bg-white/90 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 w-[90%] max-w-sm">
        <div className="flex items-center px-4 py-2 border-r border-gray-100 flex-1">
          <MapPin className="w-5 h-5 mr-2 text-primary drop-shadow-sm" />
          <span className="font-serif font-bold text-lg text-gray-800 tracking-tight">WanderMark</span>
        </div>
        <button 
          onClick={() => setPerspectiveOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors whitespace-nowrap outline-none"
        >
          <List className="w-4 h-4 mr-1.5" />
          Places
        </button>
      </div>

      {/* Perspective View Drawer */}
      {perspectiveOpen && (
        <div className="absolute inset-x-0 bottom-0 top-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold">Perspective View</h2>
            <button onClick={() => setPerspectiveOpen(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
              <X className="w-5 h-5"/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {markers.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">No places saved yet.</div>
            ) : (
              markers.map((marker) => (
                <div key={marker.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setMapCenter([marker.lat, marker.lng]);
                  setPerspectiveOpen(false);
                  setSelectedMarker(marker);
                }}>
                  <div>
                    <h3 className="font-bold text-gray-900">{marker.title}</h3>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{marker.address}</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase">
                    {marker.status.replace('_', ' ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* Journal Drawer */}
      {selectedMarker && (
        <div className="absolute inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100">
          <div className="p-6 border-b border-gray-100/60 bg-gray-50/50 flex justify-between items-start">
            <div className="pr-4">
              <h2 className="text-3xl font-bold font-serif text-gray-900 tracking-tight leading-tight">{selectedMarker.title}</h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {selectedMarker.address}</p>
              <div className="flex gap-2 mt-3">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider">
                  {selectedMarker.status.replace('_', ' ')}
                </span>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider">
                  {selectedMarker.category}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedMarker(null)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-500 shadow-sm transition-all"><X className="w-4 h-4"/></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50/30">
            {/* Memory List */}
            <div className="p-6 space-y-6">
              <h3 className="font-serif font-bold text-lg text-gray-800 flex items-center mb-4"><BookOpen className="w-4 h-4 mr-2 text-primary" /> Memory Journal</h3>
              
              {memories.filter((m) => m.markerId === selectedMarker.id).length === 0 ? (
                <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                  <Camera className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No memories here yet.<br/>Log your first visit below!</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {memories.filter((m) => m.markerId === selectedMarker.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(memory => (
                    <div key={memory.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Star className="w-4 h-4" />
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(memory.createdAt).toLocaleDateString()}</span>
                          <span className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < memory.emotionScore ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                          </span>
                        </div>
                        {memory.noteContent && <p className="text-gray-700 text-sm mb-3 leading-relaxed">{memory.noteContent}</p>}
                        
                        {memory.photoUrls.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                            {memory.photoUrls.map((url, i) => (
                              <img key={i} src={url} alt="Memory" className="h-20 w-20 object-cover rounded-xl shadow-sm snap-start shrink-0" referrerPolicy="no-referrer" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Memory Form */}
            <div className="p-6 bg-white border-t border-gray-100">
              <h3 className="font-serif font-bold text-lg text-gray-800 mb-4 tracking-tight">Add Entry</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">Rating</label>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{newMemoryScore}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(score => (
                      <button 
                        key={score} 
                        onClick={() => setNewMemoryScore(score)}
                        className={`flex-1 py-1.5 flex justify-center rounded-lg transition-colors ${newMemoryScore >= score ? 'bg-orange-50 text-yellow-500' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                      >
                        <Star className={`w-5 h-5 ${newMemoryScore >= score ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Note</label>
                   <textarea 
                     value={newMemoryNote}
                     onChange={e => setNewMemoryNote(e.target.value)}
                     className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:bg-white transition-all text-gray-800 text-sm resize-none"
                     rows={3}
                     placeholder="What did you think of this place?"
                   />
                </div>

                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Photos</label>
                   <div className="flex gap-2 overflow-x-auto pb-2">
                     {newMemoryPhotos.map((url, i) => (
                       <div key={i} className="relative group shrink-0">
                         <img src={url} alt="Upload" className="h-16 w-16 object-cover rounded-xl border border-gray-200" referrerPolicy="no-referrer" />
                         <button onClick={() => setNewMemoryPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-white rounded-full text-red-500 shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 font-bold"/></button>
                       </div>
                     ))}
                     
                     <label className="h-16 w-16 shrink-0 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-orange-50/50 transition-all cursor-pointer">
                       <ImageIcon className="w-5 h-5" />
                       <span className="text-[9px] font-bold mt-1 uppercase">Add</span>
                       <input type="file" className="hidden" accept="image/*" multiple onChange={simulatePhotoUpload} ref={fileInputRef} />
                     </label>
                   </div>
                </div>
                
                <button 
                  onClick={handleSaveMemory}
                  disabled={!newMemoryNote.trim() && newMemoryPhotos.length === 0}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold tracking-wide shadow-[0_4px_14px_rgba(170,53,0,0.3)] hover:shadow-[0_6px_20px_rgba(170,53,0,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  Log Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMarking && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg animate-pulse font-medium text-sm">
          Tap on the map to place your marker
        </div>
      )}

      {/* Floating Action Button for manual check-in */}
      <div className="absolute right-4 bottom-28 z-10 flex flex-col gap-3">
        <button 
          onClick={requestCurrentLocationAndMark}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${isMarking ? 'bg-red-500 text-white rotate-45' : 'bg-white text-gray-800'}`}
        >
          {isMarking ? <Plus className="w-6 h-6" /> : <MapPin className="w-6 h-6 text-primary" />}
        </button>
      </div>

      {/* Marker Creation Dialog */}
      {markerFormOpen && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border border-white/50">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-serif text-gray-900 tracking-tight">Save Location</h2>
                <button onClick={() => setMarkerFormOpen(false)} className="bg-gray-100/80 hover:bg-gray-200 text-gray-500 rounded-full p-2 transition-colors"><X className="w-4 h-4"/></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Name</label>
                  <input 
                    type="text" 
                    value={newMarkerTitle}
                    onChange={e => setNewMarkerTitle(e.target.value)}
                    placeholder="e.g. Secret Coffee Shop"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:bg-white transition-all text-gray-800 font-medium"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Notes / Address</label>
                  <input 
                    type="text" 
                    value={newMarkerAddress}
                    onChange={e => setNewMarkerAddress(e.target.value)}
                    placeholder="Brief description or address"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-primary/50 focus:bg-white transition-all text-gray-800"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Ăn uống', 'Chill', 'Work', 'Other'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewMarkerCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${newMarkerCategory === cat ? 'bg-primary text-primary-foreground shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMarkerStatus('visited')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${newMarkerStatus === 'visited' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-transparent border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Visited
                    </button>
                    <button
                      onClick={() => setNewMarkerStatus('want_to_go')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${newMarkerStatus === 'want_to_go' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-transparent border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Want to go
                    </button>
                  </div>
                </div>

              </div>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <button 
                  onClick={handleSaveMarker}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold tracking-wide shadow-[0_4px_14px_rgba(170,53,0,0.3)] hover:shadow-[0_6px_20px_rgba(170,53,0,0.4)] transition-all active:scale-[0.98]"
                >
                  Save to Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Chatbot panel (bottom) */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl sm:bottom-4 bg-white/95 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-t-3xl sm:rounded-3xl border border-white/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${chatOpen ? 'h-[75vh] sm:h-[600px] max-h-[800px]' : 'h-24 sm:h-[72px]'}`}>
        
        {/* Handle bar to drag/toggle (Mobile only) */}
        <div 
          className="w-full h-8 flex sm:hidden items-center justify-center cursor-pointer"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header (Desktop + When Open) */}
        <div className={`hidden sm:flex ${chatOpen ? 'flex' : 'hidden'} justify-between items-center px-6 py-4 border-b border-gray-100/50`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-lg">Wander AI</span>
          </div>
          {chatOpen && (
             <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
               <X className="w-5 h-5" />
             </button>
          )}
        </div>

        {chatOpen && (
          <div className="h-[calc(100%-120px)] sm:h-[calc(100%-140px)] overflow-y-auto px-6 pt-4 pb-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col justify-center items-center text-gray-400 space-y-4 pb-10">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl text-gray-900 font-serif font-bold tracking-tight">I'm your WanderMark AI</h3>
                <p className="text-center font-medium text-sm max-w-[250px]">Ask me to suggest nearby coffee shops or recall your memories.</p>
                <div className="flex gap-2 flex-wrap justify-center mt-6">
                  <button onClick={() => { setQuery("Find a chill cafe near me"); setChatOpen(true); }} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm hover:border-primary/50 hover:text-primary transition-all">Find a chill cafe</button>
                  <button onClick={() => { setQuery("Where did we go last anniversary?"); setChatOpen(true); }} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm hover:border-primary/50 hover:text-primary transition-all">Recall a memory</button>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`mb-6 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in slide-in-from-bottom-2'}`}>
                <div className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-md' : 'bg-gray-100/80 backdrop-blur-sm text-gray-800 rounded-tl-md border border-gray-200/50'}`}>
                  {msg.content}
                </div>
                
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-4 w-full flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide -mx-6 px-6">
                    {msg.actions.map((action, j) => (
                      <div key={j} className="min-w-[260px] bg-white border border-gray-100 rounded-2xl p-5 shadow-sm snap-start flex flex-col gap-2 relative overflow-hidden transition-all hover:shadow-md">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
                        <h4 className="font-bold text-gray-900 truncate text-base">{action.title}</h4>
                        <p className="text-xs text-gray-500 truncate mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> {action.address}</p>
                        
                        <div className="mt-2 flex gap-2 w-full">
                          {action.type === 'directions' && (
                            <button 
                              className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                              onClick={() => {
                                setMapCenter([action.lat, action.lng]);
                                setChatOpen(false);
                              }}
                            >
                              <Navigation className="w-3.5 h-3.5" /> Fly to
                            </button>
                          )}
                          {(action.type === 'save' || action.type === 'directions') && (
                            <button 
                             className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                             onClick={() => addMarker({
                               id: Math.random().toString(), userId: 'me', lat: action.lat, lng: action.lng, address: action.address, title: action.title, category: 'Other', status: 'want_to_go', tags: [], createdAt: new Date().toISOString()
                             })}
                            >
                              <Plus className="w-3.5 h-3.5" /> Save Pin
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3 text-gray-400 p-2 animate-in fade-in">
                <Bot className="w-5 h-5 text-primary/50" />
                <div className="flex space-x-1.5 bg-gray-100/80 px-3 py-2 rounded-full border border-gray-200/50">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            )}
            <div className="h-4"></div>
          </div>
        )}

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-white sm:rounded-b-3xl sm:border-transparent border-t border-gray-100">
          <form onSubmit={handleAIQuery} className="flex items-center gap-2 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/80">
               <Bot className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setChatOpen(true)}
              placeholder="Ask Wander AI (e.g. cafe near here...)"
              className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-gray-50/80 outline-none rounded-full text-[15px] font-medium placeholder:text-gray-400 focus:bg-gray-50 focus:ring-2 focus:ring-primary/20 hover:bg-gray-100/80 transition-all border border-gray-200/60 focus:border-primary/30 shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!query.trim() || isTyping}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center rounded-full transition-all duration-300 ${query.trim() && !isTyping ? 'bg-primary text-primary-foreground shadow-md -translate-y-1/2 cursor-pointer scale-100' : 'bg-transparent text-gray-300 scale-90'}`}
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

