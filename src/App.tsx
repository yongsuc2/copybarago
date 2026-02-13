import { GameProvider, useGame } from './presentation/GameContext';
import { ResourceBar } from './presentation/components/ResourceBar';
import { NavBar } from './presentation/components/NavBar';
import { MainScreen } from './presentation/screens/MainScreen';
import { ChapterScreen } from './presentation/screens/ChapterScreen';
import { TalentScreen } from './presentation/screens/TalentScreen';
import { EquipmentScreen } from './presentation/screens/EquipmentScreen';
import { PetScreen } from './presentation/screens/PetScreen';
import { ContentScreen } from './presentation/screens/ContentScreen';
import { GachaScreen } from './presentation/screens/GachaScreen';

function ScreenRouter() {
  const { screen } = useGame();

  switch (screen) {
    case 'main': return <MainScreen />;
    case 'chapter': return <ChapterScreen />;
    case 'talent': return <TalentScreen />;
    case 'equipment': return <EquipmentScreen />;
    case 'pet': return <PetScreen />;
    case 'content': return <ContentScreen />;
    case 'gacha': return <GachaScreen />;
    default: return <MainScreen />;
  }
}

function AppLayout() {
  const { game, screen } = useGame();
  const inChapter = screen === 'chapter' && game.currentChapter !== null;

  return (
    <>
      {!inChapter && <ResourceBar />}
      <ScreenRouter />
      <NavBar />
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <AppLayout />
    </GameProvider>
  );
}

export default App;
