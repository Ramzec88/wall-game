import React from 'react';
import { GameBoardComponent } from './ui/GameBoard';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header>
        <h1>Игра "Стена"</h1>
      </header>
      <main>
        <GameBoardComponent />
      </main>
      <footer>
        <p>© 2025 Wall Game</p>
      </footer>
    </div>
  );
};

export default App;
