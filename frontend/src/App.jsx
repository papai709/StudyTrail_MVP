import Home from "./pages/Home";
import Log from "./pages/Log";
import Signed from "./pages/Signed";
import Profile from "./pages/Profile";
import ScrollToTop from './pages/ScrollToTop';
import { ThemeProvider } from './pages/ThemeContext';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Feed from "./pages/Feed";
import Working from "./pages/Working";
import Workflow from "./pages/Workflow";

function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
     <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/log" element={<Log />} />
        <Route path="/signed" element={<Signed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feed" element={<Feed/>} />
        <Route path="/working" element={<Working />} />
        <Route path="/workflow" element={<Workflow />} />
      </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
