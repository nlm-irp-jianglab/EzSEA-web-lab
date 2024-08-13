import React, { useRef } from 'react';
import n18 from '../components/task2/N18.json'
import SkylignComponent from "../components/skylign-component";

export const App = () => {
  const logoRefTop = useRef(null);
  const logoRefBot = useRef(null);

  const handleColumnClickTop = (index, column) => {
    console.log(`Column ${index} clicked`, column);
    logoRefBot.current.scrollToColumn(index);
  };

  const handleColumnClickBot = (index, column) => {
    console.log(`Column ${index} clicked`, column);
    logoRefTop.current.scrollToColumn(index);
  };

  return (
    <div>
      <p>Playground</p>
      <div style={{ width: '900px', height: '900px', overflow: 'hidden' }}>
        <SkylignComponent logoData={n18} name={"N18"} onColumnClick={handleColumnClickTop} ref={logoRefTop}/>
        <SkylignComponent logoData={n18} name={"N18_dup"} onColumnClick={handleColumnClickBot} ref={logoRefBot} />
      </div>
    </div>
  );


}

export default App;