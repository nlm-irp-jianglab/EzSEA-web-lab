import n18 from '../components/task2/N18.json'
import SkylignComponent from "../components/skylign-component";

export const App = () => {

  return (
    <div>
        <p>Playground</p>
        <SkylignComponent logoData={n18} name={"N18"}/>
        <SkylignComponent logoData={n18} name="N18_copy"/>
    </div>
  );
}

export default App;