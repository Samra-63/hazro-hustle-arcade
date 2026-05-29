import React, { useState, useEffect, useRef } from 'react';
import './Game.css';

import morningBg from './assets/images/bg_bazaar_morning.png';
import afternoonBg from './assets/images/bg_dhaba_afternoon.png';
import nightBg from './assets/images/bg_hazro_night.png';
import rehriImg from './assets/images/khota_rehri.png';
import teapotImg from './assets/images/teapot.png';
import busImg from './assets/images/bus.png';
import rickshawImg from './assets/images/rickshaw.png';
import hukkaImg from './assets/images/hukka.png';

import gameMusic from './assets/sounds/game_music.mp3';
import pointSound from './assets/sounds/point.mp3';

const Game = () => {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bgPos, setBgPos] = useState(0);
  const [playerY, setPlayerY] = useState(70); 
  const [objects, setObjects] = useState([]); 
  const [speed] = useState(1.6); // Slightly slower for better recording quality
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  const bgMusicRef = useRef(new Audio(gameMusic));
  const pointAudioRef = useRef(new Audio(pointSound));

  useEffect(() => {
    const assets = [morningBg, afternoonBg, nightBg, rehriImg, teapotImg, busImg, rickshawImg, hukkaImg];
    let loadedCount = 0;

    assets.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === assets.length) {
          setIsAssetsLoaded(true);
        }
      };
    });
  }, []);

  useEffect(() => {
    const audio = bgMusicRef.current;
    audio.loop = true;
    audio.volume = 0.4;
    audio.playbackRate = 1.0;
    
    const startMusic = () => {
      if (audio.paused) audio.play().catch(() => {});
    };

    window.addEventListener('mousedown', startMusic);
    window.addEventListener('keydown', startMusic);

    return () => {
      window.removeEventListener('mousedown', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isGameOver) return;
      if (e.key === 'ArrowUp') setPlayerY(70);
      else if (e.key === 'ArrowDown') setPlayerY(85);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  useEffect(() => {
    if (isGameOver || !isAssetsLoaded) return;
    
    const interval = setInterval(() => {
      setBgPos(p => p - speed);
      setObjects(prev => prev.map(obj => ({
        ...obj, 
        x: obj.x - speed 
      })).filter(obj => obj.x > -20));
    }, 30);

    const spawner = setInterval(() => {
      const types = ['teapot', 'bus', 'rickshaw', 'hukka'];
      const type = types[Math.floor(Math.random() * types.length)];
      const lanes = [70, 85];
      
      setObjects(prev => [...prev, { 
        id: Date.now(), 
        type, 
        x: 110, 
        y: lanes[Math.floor(Math.random() * lanes.length)] 
      }]);
    }, 3200); // More time to react

    return () => { clearInterval(interval); clearInterval(spawner); };
  }, [isGameOver, speed, isAssetsLoaded]);

  const playSnappyPointSound = () => {
    const sfx = new Audio(pointSound);
    sfx.volume = 0.5;
    sfx.play().catch(() => {});
  };

  useEffect(() => {
    if (isGameOver || !isAssetsLoaded) return;
    const check = setInterval(() => {
      setObjects(prev => {
        let hit = false;
        const remaining = prev.filter(obj => {
          const isCollidingX = obj.x > 18 && obj.x < 26; 
          const isCollidingY = Math.abs(obj.y - playerY) < 5;
          
          if (isCollidingX && isCollidingY) {
            if (obj.type === 'teapot' || obj.type === 'hukka') { 
              setScore(s => s + 10); 
              playSnappyPointSound();
              return false; 
            }
            if (obj.type === 'bus' || obj.type === 'rickshaw') { 
              hit = true;
              return false; 
            }
          }
          return true;
        });
        if (hit) setIsGameOver(true);
        return remaining;
      });
    }, 50);
    return () => clearInterval(check);
  }, [playerY, isGameOver, isAssetsLoaded]);

  const getAsset = (type) => {
    switch(type) {
      case 'teapot': return teapotImg;
      case 'bus': return busImg;
      case 'rickshaw': return rickshawImg;
      case 'hukka': return hukkaImg;
      default: return null;
    }
  };

  const handleRestart = () => {
    setScore(0);
    setObjects([]);
    setIsGameOver(false);
    setPlayerY(70);
  };

  if (!isAssetsLoaded) {
    return (
      <div className="loading-screen">
        <h1 style={{color: 'white'}}>Hazro Hustle Loading...</h1>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="game-viewport">
      <div className="hud">Cargo Score: {score}</div>
      
      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-box">
            <h1>CHACHA RUK GAYE!</h1>
            <p>Final Score: {score}</p>
            <button onClick={handleRestart}>Try Again</button>
          </div>
        </div>
      )}

      <div className="bg-layers" style={{ backgroundPosition: `${bgPos}px 0` }}>
        <div className={`bg-layer morning ${score < 50 ? 'active' : ''}`} style={{ backgroundImage: `url(${morningBg})` }}></div>
        <div className={`bg-layer afternoon ${score >= 50 && score < 100 ? 'active' : ''}`} style={{ backgroundImage: `url(${afternoonBg})` }}></div>
        <div className={`bg-layer night ${score >= 100 ? 'active' : ''}`} style={{ backgroundImage: `url(${nightBg})` }}></div>
      </div>

      <img src={rehriImg} className="rehri-player flipped" 
           style={{ top: `${playerY}%`, left: '20%' }} alt="Rehri" />

      {objects.map(obj => (
        <img key={obj.id} 
             src={getAsset(obj.type)} 
             className={`game-obj ${obj.type}`} 
             style={{ left: `${obj.x}%`, top: `${obj.y}%` }} 
             alt={obj.type} />
      ))}

      <div className="controls-container">
        <button className="nav-btn-large" onClick={() => setPlayerY(70)}><span>▲</span></button>
        <button className="nav-btn-large" onClick={() => setPlayerY(85)}><span>▼</span></button>
      </div>
    </div>
  );
};

export default Game;