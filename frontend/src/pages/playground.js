import ConsoleLogs from '../components/consolelog';

function Playground() {
  const jobid = 'EzSEA_6vdu1z4m220fnx9';

  return (
    <div>
      <h1>Application Console</h1>
      <ConsoleLogs jobid={jobid}/>
    </div>
  );
}

export default Playground;
