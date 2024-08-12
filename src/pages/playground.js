import n18 from '../components/task2/N18.json'
import SkylignComponent from "../components/skylign-component";

export const App = () => {
  const handleColumnClick = (index, column) => {
    console.log(`Column ${index} clicked`, column);
    // Perform any other actions you need when a column is clicked
  };

  return (
    <div>
      <p>Playground</p>
      <div style={{ width: '900px', height: '700px', overflow: 'hidden' }}>
        <SkylignComponent logoData={n18} name={"N18"} onColumnClick={handleColumnClick}/>
      </div>
    </div>
  );


}

export default App;