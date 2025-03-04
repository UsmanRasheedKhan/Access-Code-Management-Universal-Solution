import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormComponent from './components/FormComponent';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:title" element={<FormComponent />} />
        <Route path="/" element={<div>Welcome! Access through proper URL</div>} />
      </Routes>
    </Router>
  );
}

export default App;